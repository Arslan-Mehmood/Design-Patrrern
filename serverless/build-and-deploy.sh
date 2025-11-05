#!/bin/bash

# Build and Deploy Script for Inventory Management System

set -e

echo "🚀 Building AWS SAM application..."
sam build

echo "📦 Deploying to AWS..."
sam deploy --guided

echo "✅ Deployment complete!"
echo ""
echo "📋 Getting API Gateway endpoint..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name inventory-management-system \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayEndpoint`].OutputValue' \
  --output text)

echo "🌐 API Gateway Endpoint: $API_ENDPOINT"
echo ""
echo "📝 Update the API URL in inventory-frontend/src/app/services/api.service.ts:"
echo "   this.apiUrl.set('$API_ENDPOINT');"
echo ""
echo "🎉 Setup complete! Now you can:"
echo "   1. Update the frontend API URL"
echo "   2. cd inventory-frontend && npm install"
echo "   3. npm start"

