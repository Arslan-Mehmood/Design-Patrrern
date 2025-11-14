# Inventory System - EKS Deployment with ArgoCD

This project demonstrates a simple inventory system deployed on AWS EKS using ArgoCD for GitOps.

## Architecture

- **Frontend**: Angular application served via Nginx
- **Backend**: Node.js Express API
- **Orchestration**: Kubernetes (EKS)
- **GitOps**: ArgoCD
- **Ingress**: Kubernetes Ingress Controller
- **Container Registry**: Docker images (ECR recommended)

## Project Structure

```
inventory-system/
├── frontend/              # Angular application
├── backend/               # Node.js API
├── k8s/                   # Kubernetes manifests
├── argocd/                # ArgoCD Application manifests
└── docs/                  # Deployment documentation
```

## Prerequisites

- AWS Account with EKS cluster
- kubectl configured
- ArgoCD installed in cluster
- Docker installed
- AWS CLI configured
- ECR repository (or Docker Hub)

## Quick Start

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

