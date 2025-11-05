# How to Delete All AWS Resources

## Quick Delete

The easiest way to delete all resources is using AWS SAM CLI:

```powershell
sam delete --stack-name inventory-management-system
```

This command will:
- Delete the entire CloudFormation stack
- Remove all AWS resources (Lambda functions, API Gateway, DynamoDB tables, Step Functions, IAM roles)
- Clean up everything created by the deployment

## Alternative: Delete via AWS CLI

If you prefer using AWS CLI directly:

```powershell
aws cloudformation delete-stack --stack-name inventory-management-system
```

Then check the deletion status:

```powershell
aws cloudformation describe-stacks --stack-name inventory-management-system
```

## What Gets Deleted

When you delete the stack, the following resources will be removed:

- ✅ **Lambda Functions** (4 functions)
  - CreateProductFunction
  - AddToSellFunction
  - GetDashboardFunction
  - ProcessInventoryFunction

- ✅ **API Gateway**
  - REST API endpoints
  - All routes and integrations

- ✅ **DynamoDB Tables** (3 tables)
  - ProductsTable
  - InventoryTable
  - CacheTable
  - ⚠️ **Warning**: All data in these tables will be permanently deleted!

- ✅ **Step Functions State Machine**
  - ProcessInventoryStateMachine

- ✅ **IAM Roles and Policies**
  - All IAM roles created for Lambda functions and Step Functions

- ✅ **S3 Bucket**
  - SAM deployment bucket (if created)

## Important Notes

1. **Data Loss**: Deleting the stack will permanently delete all data in DynamoDB tables. Make sure to backup any important data first if needed.

2. **Deletion Time**: The deletion process can take several minutes (5-15 minutes) depending on the resources.

3. **Billing**: Once deleted, you will stop being charged for these resources immediately (resources are billed until deletion completes).

4. **Verification**: After deletion, you can verify resources are gone by checking the CloudFormation console or using:
   ```powershell
   aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE
   ```

## Troubleshooting

### If deletion fails:

1. Check for any resources that couldn't be deleted:
   ```powershell
   aws cloudformation describe-stack-events --stack-name inventory-management-system
   ```

2. Common issues:
   - **DynamoDB tables with data**: Empty the tables first if needed
   - **S3 buckets with objects**: Empty the bucket first
   - **Dependencies**: Some resources might have dependencies that prevent deletion

3. Force delete (if needed):
   ```powershell
   # Delete stack with retained resources (use with caution)
   aws cloudformation delete-stack --stack-name inventory-management-system --retain-resources
   ```

## Manual Cleanup (if needed)

If automatic deletion fails, you may need to manually delete resources:

1. **Empty DynamoDB Tables**:
   ```powershell
   aws dynamodb delete-table --table-name ProductsTable
   aws dynamodb delete-table --table-name InventoryTable
   aws dynamodb delete-table --table-name CacheTable
   ```

2. **Delete Lambda Functions**:
   ```powershell
   aws lambda delete-function --function-name CreateProductFunction
   aws lambda delete-function --function-name AddToSellFunction
   aws lambda delete-function --function-name GetDashboardFunction
   aws lambda delete-function --function-name ProcessInventoryFunction
   ```

3. **Delete Step Functions**:
   ```powershell
   aws stepfunctions delete-state-machine --state-machine-arn <ARN>
   ```

However, using `sam delete` is the recommended and safest approach as it handles all dependencies automatically.

