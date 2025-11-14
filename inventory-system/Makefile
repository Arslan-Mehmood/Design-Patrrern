.PHONY: help build-frontend build-backend push-images deploy-local clean

# Variables
AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 
ECR_REGISTRY = $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

build-frontend: ## Build frontend Docker image
	cd frontend && docker build -t inventory-frontend:latest .

build-backend: ## Build backend Docker image
	cd backend && docker build -t inventory-backend:latest .

build-all: build-frontend build-backend ## Build all Docker images

push-images: ## Build and push all images to ECR (requires AWS_ACCOUNT_ID)
	@if [ -z "$(AWS_ACCOUNT_ID)" ]; then \
		echo "Error: AWS_ACCOUNT_ID is required. Usage: make push-images AWS_ACCOUNT_ID=123456789012"; \
		exit 1; \
	fi
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REGISTRY)
	cd frontend && docker build -t inventory-frontend:latest . && \
	docker tag inventory-frontend:latest $(ECR_REGISTRY)/inventory-frontend:latest && \
	docker push $(ECR_REGISTRY)/inventory-frontend:latest
	cd backend && docker build -t inventory-backend:latest . && \
	docker tag inventory-backend:latest $(ECR_REGISTRY)/inventory-backend:latest && \
	docker push $(ECR_REGISTRY)/inventory-backend:latest
	@echo "Images pushed to $(ECR_REGISTRY)"

deploy-local: ## Deploy locally using Docker Compose (if available)
	@echo "Local deployment not implemented. Use docker-compose or minikube."

clean: ## Clean up local Docker images
	docker rmi inventory-frontend:latest inventory-backend:latest || true

update-k8s-images: ## Update Kubernetes manifests with ECR registry (requires ECR_REGISTRY)
	@if [ -z "$(ECR_REGISTRY)" ]; then \
		echo "Error: ECR_REGISTRY is required. Usage: make update-k8s-images ECR_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com"; \
		exit 1; \
	fi
	sed -i.bak "s|<ECR_REGISTRY>|$(ECR_REGISTRY)|g" k8s/backend-deployment.yaml
	sed -i.bak "s|<ECR_REGISTRY>|$(ECR_REGISTRY)|g" k8s/frontend-deployment.yaml
	rm -f k8s/*.bak
	@echo "Kubernetes manifests updated with $(ECR_REGISTRY)"

