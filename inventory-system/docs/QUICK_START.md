# Quick Start - Deployment Checklist

## Pre-Deployment Checklist

- [ ] AWS EKS cluster is running and accessible
- [ ] `kubectl` is configured to access your EKS cluster
- [ ] AWS CLI is configured with appropriate credentials
- [ ] Docker is installed and running
- [ ] ArgoCD is installed in your cluster
- [ ] NGINX Ingress Controller is installed
- [ ] ECR repositories are created
- [ ] Git repository is set up for Kubernetes manifests

## Deployment Steps

### 1. Build and Push Images

**Linux/Mac:**
```bash
cd scripts
./build-and-push.sh us-east-1 <YOUR_AWS_ACCOUNT_ID>
```

**Windows:**
```powershell
cd scripts
.\build-and-push.ps1 -AWS_REGION us-east-1 -AWS_ACCOUNT_ID <YOUR_AWS_ACCOUNT_ID>
```

### 2. Update Kubernetes Manifests

Update image references in:
- `k8s/backend-deployment.yaml` - Replace `<ECR_REGISTRY>`
- `k8s/frontend-deployment.yaml` - Replace `<ECR_REGISTRY>`
- `k8s/ingress.yaml` - Replace `inventory.example.com` with your domain

**Linux/Mac:**
```bash
./scripts/update-k8s-images.sh <ECR_REGISTRY>
```

### 3. Push to Git

```bash
git add .
git commit -m "Deploy inventory system"
git push origin main
```

### 4. Create ArgoCD Application

Update `argocd/application.yaml` with your Git repo URL, then:

```bash
kubectl apply -f argocd/application.yaml
```

Or via ArgoCD CLI:
```bash
argocd app create inventory-system \
  --repo <YOUR_GIT_REPO_URL> \
  --path inventory-system/k8s \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace inventory-system \
  --sync-policy automated
```

### 5. Verify Deployment

```bash
# Check ArgoCD sync status
argocd app get inventory-system

# Check pods
kubectl get pods -n inventory-system

# Check services
kubectl get svc -n inventory-system

# Check ingress
kubectl get ingress -n inventory-system
```

### 6. Configure DNS

1. Get LoadBalancer URL:
```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

2. Create CNAME record pointing to LoadBalancer hostname

3. Update ingress.yaml with your domain and push to Git

## Common Commands

### View Logs
```bash
# Frontend
kubectl logs -n inventory-system -l app=inventory-frontend -f

# Backend
kubectl logs -n inventory-system -l app=inventory-backend -f
```

### Scale Application
```bash
kubectl scale deployment inventory-frontend -n inventory-system --replicas=3
kubectl scale deployment inventory-backend -n inventory-system --replicas=3
```

### Restart Deployment
```bash
kubectl rollout restart deployment inventory-frontend -n inventory-system
kubectl rollout restart deployment inventory-backend -n inventory-system
```

### Access ArgoCD UI
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Access at https://localhost:8080
```

## Troubleshooting

1. **Pods not starting**: Check logs and events
2. **Image pull errors**: Verify ECR access and image tags
3. **Ingress not working**: Check NGINX controller and DNS
4. **ArgoCD sync issues**: Check Git repository access and paths

For detailed troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).

