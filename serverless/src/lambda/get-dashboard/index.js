const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const INVENTORY_TABLE = process.env.INVENTORY_TABLE;
const CACHE_TABLE = process.env.CACHE_TABLE;
const CACHE_TTL = 300; // 5 minutes in seconds

exports.handler = async (event) => {
    try {
        const cacheKey = 'dashboard:main';
        
        // Check cache first
        try {
            const cacheResponse = await docClient.send(new GetCommand({
                TableName: CACHE_TABLE,
                Key: { cacheKey }
            }));
            
            if (cacheResponse.Item && cacheResponse.Item.data) {
                const ttl = cacheResponse.Item.ttl;
                const now = Math.floor(Date.now() / 1000);
                
                if (ttl > now) {
                    return {
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: cacheResponse.Item.data
                    };
                }
            }
        } catch (cacheError) {
            console.error('Cache read failed:', cacheError);
        }
        
        // Scan products table
        const productsResponse = await docClient.send(new ScanCommand({
            TableName: PRODUCTS_TABLE
        }));
        const products = productsResponse.Items || [];
        
        // Scan inventory table
        const inventoryResponse = await docClient.send(new ScanCommand({
            TableName: INVENTORY_TABLE
        }));
        const inventoryItems = inventoryResponse.Items || [];
        
        // Create inventory map
        const inventoryMap = {};
        inventoryItems.forEach(item => {
            inventoryMap[item.productId] = item;
        });
        
        // Combine products with inventory
        const dashboardData = {
            totalProducts: products.length,
            totalInventoryItems: inventoryItems.length,
            products: [],
            inventory: []
        };
        
        let totalValue = 0;
        
        products.forEach(product => {
            const productId = product.productId;
            const inventory = inventoryMap[productId] || {};
            const quantity = inventory.quantity || 0;
            const price = product.price || 0;
            const value = price * quantity;
            totalValue += value;
            
            const productInfo = {
                productId,
                name: product.name || '',
                category: product.category || '',
                price,
                inStock: quantity > 0,
                quantity,
                value
            };
            
            dashboardData.products.push(productInfo);
            
            if (quantity > 0) {
                dashboardData.inventory.push({
                    productId,
                    name: product.name || '',
                    quantity,
                    value
                });
            }
        });
        
        dashboardData.totalInventoryValue = totalValue;
        
        const responseBody = JSON.stringify(dashboardData);
        
        // Cache the result
        try {
            const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL;
            await docClient.send(new PutCommand({
                TableName: CACHE_TABLE,
                Item: {
                    cacheKey,
                    data: responseBody,
                    ttl
                }
            }));
        } catch (cacheError) {
            console.error('Cache write failed:', cacheError);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: responseBody
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

