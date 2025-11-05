# Deployment Guide

## Quick Start

### 1. Deploy Backend (AWS SAM)

```bash
# Build the application
sam build

# Deploy (first time - guided)
sam deploy --guided

# Subsequent deployments
sam deploy
```

**During guided deployment:**
- Stack name: `inventory-management-system`
- Region: `us-east-1` (or your preferred region)
- Confirm changes: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `N`
- Save arguments: `Y`

### 2. Get API Gateway URL

After deployment, get the API endpoint:

```bash
aws cloudformation describe-stacks \
  --stack-name inventory-management-system \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayEndpoint`].OutputValue' \
  --output text
```

### 3. Configure Frontend

Update `inventory-frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'YOUR_API_GATEWAY_ENDPOINT_HERE'
};
```

### 4. Run Frontend

```bash
cd inventory-frontend
npm install
npm start
```

Visit `http://localhost:4200`

## Architecture Overview

- **4 Lambda Functions** (Node.js 20.x)
  - CreateProduct: Creates new products
  - AddToSell: Adds products to inventory
  - GetDashboard: Retrieves dashboard statistics
  - ProcessInventory: Step Functions workflow handler

- **3 DynamoDB Tables**
  - ProductsTable: Stores product information
  - InventoryTable: Stores inventory quantities
  - CacheTable: Caching layer (with TTL)

- **Step Functions State Machine**
  - Validates product existence
  - Updates inventory quantity

- **API Gateway**
  - REST API endpoints
  - CORS enabled

## Free Tier Limits

This setup uses:
- **DynamoDB**: 5 RCU/WCU per table (within 25 RCU/WCU free tier)
- **Lambda**: Minimal memory (256 MB)
- **Step Functions**: 4,000 state transitions/month (free tier)
- **API Gateway**: 1M requests/month (free tier)

## Monitoring

View logs:
```bash
# Lambda logs
sam logs -n CreateProductFunction --stack-name inventory-management-system --tail

# Step Functions
aws stepfunctions list-executions --state-machine-arn <ARN>
```

## Cleanup

To remove all resources:
```bash
sam delete --stack-name inventory-management-system
```

