#!/bin/bash

# Build and Push Script for Inventory System
# Usage: ./build-and-push.sh <AWS_REGION> <AWS_ACCOUNT_ID>

set -e

AWS_REGION=${1:-us-east-1}
AWS_ACCOUNT_ID=${2}

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "Error: AWS_ACCOUNT_ID is required"
    echo "Usage: ./build-and-push.sh <AWS_REGION> <AWS_ACCOUNT_ID>"
    exit 1
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Building and pushing images to ${ECR_REGISTRY}"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push frontend
echo "Building frontend..."
cd frontend
docker build -t inventory-frontend:latest .
docker tag inventory-frontend:latest $ECR_REGISTRY/inventory-frontend:latest
docker push $ECR_REGISTRY/inventory-frontend:latest
cd ..

# Build and push backend
echo "Building backend..."
cd backend
docker build -t inventory-backend:latest .
docker tag inventory-backend:latest $ECR_REGISTRY/inventory-backend:latest
docker push $ECR_REGISTRY/inventory-backend:latest
cd ..

echo "Build and push completed successfully!"
echo "Update your Kubernetes manifests with: ${ECR_REGISTRY}"

