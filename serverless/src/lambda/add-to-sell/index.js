const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sfnClient = new SFNClient({});

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const INVENTORY_TABLE = process.env.INVENTORY_TABLE;
const CACHE_TABLE = process.env.CACHE_TABLE;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        
        // Validate required fields
        if (!body.productId || body.quantity === undefined) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Missing required fields: productId and quantity'
                })
            };
        }
        
        const productId = body.productId;
        const quantity = parseInt(body.quantity, 10);
        
        // Verify product exists
        const productResponse = await docClient.send(new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { productId }
        }));
        
        if (!productResponse.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Product not found'
                })
            };
        }
        
        // Start Step Functions execution
        const stepInput = {
            productId,
            quantity
        };
        
        if (STATE_MACHINE_ARN) {
            await sfnClient.send(new StartExecutionCommand({
                stateMachineArn: STATE_MACHINE_ARN,
                input: JSON.stringify(stepInput)
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
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Product added to inventory for selling',
                productId,
                quantity
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};

