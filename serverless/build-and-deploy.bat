@echo off
REM Build and Deploy Script for Inventory Management System (Windows)

echo Building AWS SAM application...
sam build

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo Deploying to AWS...
sam deploy --guided

if %ERRORLEVEL% NEQ 0 (
    echo Deployment failed!
    exit /b %ERRORLEVEL%
)

echo Deployment complete!
echo.
echo Getting API Gateway endpoint...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name inventory-management-system --query "Stacks[0].Outputs[?OutputKey==`ApiGatewayEndpoint`].OutputValue" --output text') do set API_ENDPOINT=%%i

echo API Gateway Endpoint: %API_ENDPOINT%
echo.
echo Update the API URL in inventory-frontend/src/app/services/api.service.ts:
echo    this.apiUrl.set('%API_ENDPOINT%');
echo.
echo Setup complete! Now you can:
echo    1. Update the frontend API URL
echo    2. cd inventory-frontend ^&^& npm install
echo    3. npm start

