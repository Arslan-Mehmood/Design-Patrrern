# Build and Push Script for Inventory System (PowerShell)
# Usage: .\build-and-push.ps1 -AWS_REGION <region> -AWS_ACCOUNT_ID <account-id>

param(
    [Parameter(Mandatory=$false)]
    [string]$AWS_REGION = "us-east-1",
    
    [Parameter(Mandatory=$true)]
    [string]$AWS_ACCOUNT_ID
)

$ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

Write-Host "Building and pushing images to ${ECR_REGISTRY}"

# Login to ECR
Write-Host "Logging in to ECR..."
$password = aws ecr get-login-password --region $AWS_REGION
$password | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push frontend
Write-Host "Building frontend..."
Set-Location frontend
docker build -t inventory-frontend:latest .
docker tag inventory-frontend:latest "${ECR_REGISTRY}/inventory-frontend:latest"
docker push "${ECR_REGISTRY}/inventory-frontend:latest"
Set-Location ..

# Build and push backend
Write-Host "Building backend..."
Set-Location backend
docker build -t inventory-backend:latest .
docker tag inventory-backend:latest "${ECR_REGISTRY}/inventory-backend:latest"
docker push "${ECR_REGISTRY}/inventory-backend:latest"
Set-Location ..

Write-Host "Build and push completed successfully!"
Write-Host "Update your Kubernetes manifests with: ${ECR_REGISTRY}"

