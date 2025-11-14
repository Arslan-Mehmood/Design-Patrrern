# Deployment Guide - Inventory System on AWS EKS with ArgoCD

This guide walks you through deploying the inventory system on AWS EKS using ArgoCD for GitOps.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **EKS Cluster** already created and configured
3. **kubectl** configured to access your EKS cluster
4. **AWS CLI** installed and configured
5. **Docker** installed locally
6. **ArgoCD** installed in your cluster
7. **ECR Repository** (or Docker Hub account)
8. **Git Repository** for storing Kubernetes manifests

## Step 1: Set Up ECR Repositories

```bash
# Set your AWS region and account ID
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name inventory-frontend --region $AWS_REGION
aws ecr create-repository --repository-name inventory-backend --region $AWS_REGION

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
```

## Step 2: Build and Push Docker Images

### Build and Push Frontend Image

```bash
cd frontend

# Build the image
docker build -t inventory-frontend:latest .

# Tag for ECR
docker tag inventory-frontend:latest $ECR_REGISTRY/inventory-frontend:latest

# Push to ECR
docker push $ECR_REGISTRY/inventory-frontend:latest
```

### Build and Push Backend Image

```bash
cd ../backend

# Build the image
docker build -t inventory-backend:latest .

# Tag for ECR
docker tag inventory-backend:latest $ECR_REGISTRY/inventory-backend:latest

# Push to ECR
docker push $ECR_REGISTRY/inventory-backend:latest
```

## Step 3: Update Kubernetes Manifests

Update the image references in the Kubernetes manifests:

```bash
cd ../k8s

# Replace <ECR_REGISTRY> with your actual ECR registry URL
# Example: 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Update backend deployment
sed -i "s|<ECR_REGISTRY>|$ECR_REGISTRY|g" backend-deployment.yaml

# Update frontend deployment
sed -i "s|<ECR_REGISTRY>|$ECR_REGISTRY|g" frontend-deployment.yaml
```

Or manually edit:
- `k8s/backend-deployment.yaml` - Replace `<ECR_REGISTRY>` with your ECR registry
- `k8s/frontend-deployment.yaml` - Replace `<ECR_REGISTRY>` with your ECR registry
- `k8s/ingress.yaml` - Replace `inventory.example.com` with your domain

## Step 4: Install NGINX Ingress Controller

```bash
# Add the NGINX Ingress Controller Helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb"
```

Get the LoadBalancer URL:
```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

## Step 5: Set Up ArgoCD (if not already installed)

```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port-forward to access ArgoCD UI (or expose via LoadBalancer/Ingress)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Access ArgoCD UI at: `https://localhost:8080`
- Username: `admin`
- Password: (from the command above)

## Step 6: Configure IAM Role for Service Accounts (IRSA)

For ECR access, set up IRSA:

```bash
# Create IAM OIDC provider for your cluster
eksctl utils associate-iam-oidc-provider --cluster <your-cluster-name> --approve

# Create IAM policy for ECR access
cat > ecr-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name ECRReadOnlyPolicy \
  --policy-document file://ecr-policy.json

# Create service account with IAM role
eksctl create iamserviceaccount \
  --cluster=<your-cluster-name> \
  --namespace=inventory-system \
  --name=ecr-reader \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/ECRReadOnlyPolicy \
  --approve
```

Update deployments to use the service account (add to spec.template.spec):
```yaml
serviceAccountName: ecr-reader
```

## Step 7: Push Kubernetes Manifests to Git

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit: Inventory system manifests"
git remote add origin <YOUR_GIT_REPO_URL>
git push -u origin main
```

## Step 8: Create ArgoCD Application

Update `argocd/application.yaml` with your Git repository URL:

```yaml
source:
  repoURL: <YOUR_GIT_REPO_URL>  # Replace with your actual repo URL
```

Apply the ArgoCD Application:

```bash
kubectl apply -f argocd/application.yaml
```

Or create via ArgoCD CLI:
```bash
argocd app create inventory-system \
  --repo <YOUR_GIT_REPO_URL> \
  --path inventory-system/k8s \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace inventory-system \
  --sync-policy automated \
  --auto-prune \
  --self-heal
```

## Step 9: Sync and Verify Deployment

```bash
# Check ArgoCD application status
argocd app get inventory-system

# Sync the application (if not automated)
argocd app sync inventory-system

# Verify pods are running
kubectl get pods -n inventory-system

# Check services
kubectl get svc -n inventory-system

# Check ingress
kubectl get ingress -n inventory-system
```

## Step 10: Configure DNS

1. Get the LoadBalancer URL from NGINX Ingress:
```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

2. Create a CNAME record in your DNS provider:
   - Name: `inventory` (or your subdomain)
   - Value: LoadBalancer hostname from above
   - TTL: 300

3. Update `k8s/ingress.yaml` with your actual domain name

4. Commit and push changes - ArgoCD will automatically sync

## Step 11: Access the Application

Once DNS is configured and propagated:
- Frontend: `https://inventory.example.com`
- Backend API: `https://inventory.example.com/api`

## Troubleshooting

### Check Pod Logs
```bash
# Frontend logs
kubectl logs -n inventory-system -l app=inventory-frontend

# Backend logs
kubectl logs -n inventory-system -l app=inventory-backend
```

### Check ArgoCD Sync Status
```bash
argocd app get inventory-system
```

### Describe Resources
```bash
kubectl describe deployment inventory-frontend -n inventory-system
kubectl describe deployment inventory-backend -n inventory-system
kubectl describe ingress inventory-ingress -n inventory-system
```

### Check Events
```bash
kubectl get events -n inventory-system --sort-by='.lastTimestamp'
```

## CI/CD Pipeline Integration

For automated deployments, you can set up a CI/CD pipeline that:
1. Builds Docker images on code changes
2. Pushes images to ECR
3. Updates image tags in Kubernetes manifests
4. Commits and pushes to Git
5. ArgoCD automatically syncs the changes

## Security Considerations

1. **Use specific image tags** instead of `latest` in production
2. **Enable Pod Security Standards** in your cluster
3. **Use secrets** for sensitive configuration
4. **Enable network policies** to restrict pod-to-pod communication
5. **Use cert-manager** for automatic TLS certificate management
6. **Enable AWS WAF** on the LoadBalancer for additional protection

## Scaling

To scale the application:
```bash
# Scale frontend
kubectl scale deployment inventory-frontend -n inventory-system --replicas=3

# Scale backend
kubectl scale deployment inventory-backend -n inventory-system --replicas=3
```

Or update the `replicas` field in the deployment manifests and let ArgoCD sync.

## Monitoring

Consider adding:
- Prometheus for metrics
- Grafana for visualization
- ELK stack or CloudWatch for logging
- Jaeger for distributed tracing

