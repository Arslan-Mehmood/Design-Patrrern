const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const CACHE_TABLE = process.env.CACHE_TABLE;

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        
        // Validate required fields
        const requiredFields = ['name', 'description', 'price', 'category'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        error: `Missing required field: ${field}`
                    })
                };
            }
        }
        
        // Create product
        const productId = require('crypto').randomUUID();
        const now = new Date().toISOString();
        
        const product = {
            productId,
            name: body.name,
            description: body.description || '',
            price: parseFloat(body.price),
            category: body.category,
            createdAt: now,
            updatedAt: now
        };
        
        // Save to DynamoDB
        await docClient.send(new PutCommand({
            TableName: PRODUCTS_TABLE,
            Item: product
        }));
        
        // Invalidate cache
        try {
            // Delete all dashboard cache entries
            const cachePatterns = ['dashboard:main', 'products:*'];
            for (const pattern of cachePatterns) {
                if (pattern.includes('*')) {
                    // For wildcard patterns, we'd need to scan, but for simplicity,
                    // we'll just delete the main dashboard cache
                    await docClient.send(new DeleteCommand({
                        TableName: CACHE_TABLE,
                        Key: { cacheKey: 'dashboard:main' }
                    }));
                } else {
                    await docClient.send(new DeleteCommand({
                        TableName: CACHE_TABLE,
                        Key: { cacheKey: pattern }
                    }));
                }
            }
        } catch (cacheError) {
            console.error('Cache invalidation failed:', cacheError);
        }
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Product created successfully',
                product
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

