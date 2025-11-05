# Inventory Management System

A full-stack inventory management system built with Angular 20, AWS Lambda, API Gateway, Step Functions, DynamoDB, and AWS SAM.

## Architecture

- **Frontend**: Angular 20 with Signals
- **Backend**: Node.js Lambda functions
- **API Gateway**: REST API endpoints
- **Step Functions**: Workflow orchestration for inventory processing
- **DynamoDB**: Persistent storage (Products, Inventory, and Cache tables)
- **AWS SAM**: Infrastructure as Code for deployment

## Features

- Create products with name, description, price, and category
- Add products to inventory for selling
- Dashboard with real-time statistics and inventory overview
- Caching layer for improved performance

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS SAM CLI installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- Node.js 20.x or higher
- npm or yarn

## AWS Free Tier Considerations

This application is optimized for AWS Free Tier:
- **Lambda**: 1M requests/month, 400,000 GB-seconds
- **DynamoDB**: 25 GB storage, 25 RCU/WCU (using PROVISIONED billing mode with 5 RCU/WCU per table)
- **Step Functions**: 4,000 state transitions/month
- **API Gateway**: 1M API calls/month
- **Cache**: Using DynamoDB instead of ElastiCache Redis (not in free tier)

## Deployment Steps

### 1. Build and Deploy Backend

```bash
# Build the SAM application
sam build

# Deploy to AWS
sam deploy --guided
```

During guided deployment, you'll be prompted for:
- Stack name: `inventory-management-system`
- AWS Region: Choose your preferred region (e.g., `us-east-1`)
- Confirm changes: Yes
- Allow SAM CLI IAM role creation: Yes
- Disable rollback: No
- Save arguments to configuration file: Yes

### 2. Get API Gateway Endpoint

After deployment, note the API Gateway endpoint from the CloudFormation outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name inventory-management-system \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayEndpoint`].OutputValue' \
  --output text
```

### 3. Configure Frontend

Update the API URL in `inventory-frontend/src/app/services/api.service.ts`:

```typescript
this.apiUrl.set('YOUR_API_GATEWAY_ENDPOINT');
```

Or create an environment file:

```bash
# Create environment file
cd inventory-frontend
echo "export const environment = { apiUrl: 'YOUR_API_GATEWAY_ENDPOINT' };" > src/environments/environment.ts
```

### 4. Install Frontend Dependencies

```bash
cd inventory-frontend
npm install
```

### 5. Run Frontend Locally

```bash
npm start
```

The application will be available at `http://localhost:4200`

### 6. Build Frontend for Production

```bash
npm run build
```

The built files will be in `dist/inventory-frontend/`. You can deploy these to:
- AWS S3 + CloudFront
- AWS Amplify
- Any static hosting service

## Project Structure

```
.
├── template.yaml              # SAM template defining AWS resources
├── samconfig.toml            # SAM CLI configuration
├── src/
│   └── lambda/
│       ├── create-product/   # Lambda function to create products
│       ├── add-to-sell/      # Lambda function to add products to inventory
│       ├── get-dashboard/    # Lambda function to get dashboard data
│       └── process-inventory/# Lambda function for Step Functions workflow
├── inventory-frontend/       # Angular 20 frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── create-product/
│   │   │   │   └── add-to-sell/
│   │   │   └── services/
│   │   └── main.ts
│   └── package.json
└── README.md
```

## API Endpoints

- `POST /products` - Create a new product
- `POST /inventory/add` - Add product to inventory
- `GET /dashboard` - Get dashboard statistics and inventory data

## Step Functions Workflow

The inventory addition process uses Step Functions:
1. **ValidateProduct**: Validates that the product exists
2. **UpdateInventory**: Updates the inventory quantity

## Cleanup

To remove all AWS resources:

```bash
sam delete --stack-name inventory-management-system
```

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/CreateProductFunction --follow
```

### DynamoDB Issues

Verify tables were created:
```bash
aws dynamodb list-tables
```

### API Gateway CORS

CORS is configured in the SAM template. If you encounter CORS issues, ensure the frontend is making requests to the correct API Gateway endpoint.

## Cost Optimization

- All tables use PROVISIONED billing mode with minimal capacity (5 RCU/WCU)
- Lambda functions use 256 MB memory (minimum)
- Cache uses DynamoDB with TTL for automatic cleanup
- Consider moving to PAY_PER_REQUEST billing mode if you exceed free tier limits

## License

MIT

