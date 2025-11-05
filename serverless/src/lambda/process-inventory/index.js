const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const INVENTORY_TABLE = process.env.INVENTORY_TABLE;
const CACHE_TABLE = process.env.CACHE_TABLE;

exports.handler = async (event) => {
    try {
        const action = event.action || 'validate';
        const productId = event.productId;
        const quantity = parseInt(event.quantity || 0, 10);
        
        if (action === 'validate') {
            // Verify product exists
            const response = await docClient.send(new GetCommand({
                TableName: PRODUCTS_TABLE,
                Key: { productId }
            }));
            
            if (!response.Item) {
                throw new Error(`Product ${productId} not found`);
            }
            
            // Return success for validation
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Product validated successfully',
                    productId
                })
            };
        } else if (action === 'update') {
            // Update inventory
            const currentTime = new Date().toISOString();
            
            // Check if inventory item exists
            const response = await docClient.send(new GetCommand({
                TableName: INVENTORY_TABLE,
                Key: { productId }
            }));
            
            if (response.Item) {
                // Update existing inventory
                const currentQuantity = response.Item.quantity || 0;
                const newQuantity = currentQuantity + quantity;
                
                await docClient.send(new UpdateCommand({
                    TableName: INVENTORY_TABLE,
                    Key: { productId },
                    UpdateExpression: 'SET quantity = :q, updatedAt = :u',
                    ExpressionAttributeValues: {
                        ':q': newQuantity,
                        ':u': currentTime
                    }
                }));
            } else {
                // Create new inventory item
                const inventoryItem = {
                    productId,
                    quantity,
                    createdAt: currentTime,
                    updatedAt: currentTime
                };
                await docClient.send(new PutCommand({
                    TableName: INVENTORY_TABLE,
                    Item: inventoryItem
                }));
            }
            
            // Invalidate cache
            try {
                await docClient.send(new DeleteCommand({
                    TableName: CACHE_TABLE,
                    Key: { cacheKey: 'dashboard:main' }
                }));
                await docClient.send(new DeleteCommand({
                    TableName: CACHE_TABLE,
                    Key: { cacheKey: `inventory:${productId}` }
                }));
            } catch (cacheError) {
                console.error('Cache invalidation failed:', cacheError);
            }
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Inventory updated successfully',
                    productId,
                    quantity
                })
            };
        } else {
            throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};

