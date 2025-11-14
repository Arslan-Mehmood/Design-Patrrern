#!/bin/bash

# Update Kubernetes manifests with ECR registry
# Usage: ./update-k8s-images.sh <ECR_REGISTRY>

set -e

ECR_REGISTRY=${1}

if [ -z "$ECR_REGISTRY" ]; then
    echo "Error: ECR_REGISTRY is required"
    echo "Usage: ./update-k8s-images.sh <ECR_REGISTRY>"
    echo "Example: ./update-k8s-images.sh 123456789012.dkr.ecr.us-east-1.amazonaws.com"
    exit 1
fi

echo "Updating Kubernetes manifests with ECR registry: ${ECR_REGISTRY}"

# Update backend deployment
sed -i.bak "s|<ECR_REGISTRY>|${ECR_REGISTRY}|g" k8s/backend-deployment.yaml
rm k8s/backend-deployment.yaml.bak

# Update frontend deployment
sed -i.bak "s|<ECR_REGISTRY>|${ECR_REGISTRY}|g" k8s/frontend-deployment.yaml
rm k8s/frontend-deployment.yaml.bak

echo "Kubernetes manifests updated successfully!"

