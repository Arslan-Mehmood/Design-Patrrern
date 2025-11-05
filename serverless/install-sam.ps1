# AWS SAM CLI Installation Script for Windows
# This script checks prerequisites and provides installation instructions

Write-Host "AWS SAM CLI Installation Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
Write-Host "Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI is NOT installed" -ForegroundColor Red
    Write-Host "  Please install from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    Write-Host ""
}

# Check if SAM CLI is installed
Write-Host ""
Write-Host "Checking AWS SAM CLI..." -ForegroundColor Yellow
try {
    $samVersion = sam --version 2>&1
    Write-Host "✓ AWS SAM CLI is installed: $samVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS SAM CLI is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation Options:" -ForegroundColor Cyan
    Write-Host "1. MSI Installer (Recommended):" -ForegroundColor Yellow
    Write-Host "   Download from: https://github.com/aws/aws-sam-cli/releases/latest" -ForegroundColor White
    Write-Host "   Look for: AWSSAMCLI-64.msi" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Using Chocolatey (if installed):" -ForegroundColor Yellow
    Write-Host "   choco install aws-sam-cli" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Using pip (if Python is installed):" -ForegroundColor Yellow
    Write-Host "   pip install aws-sam-cli" -ForegroundColor White
    Write-Host ""
}

# Check if Node.js is installed
Write-Host ""
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is NOT installed" -ForegroundColor Red
    Write-Host "  Please install from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
}

# Check if Docker is installed (optional)
Write-Host ""
Write-Host "Checking Docker (optional for local testing)..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠ Docker is NOT installed (optional for local testing)" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "For detailed instructions, see INSTALL_SAM.md" -ForegroundColor Cyan
Write-Host ""

# Check if AWS credentials are configured
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ AWS credentials are configured" -ForegroundColor Green
    } else {
        Write-Host "⚠ AWS credentials may not be configured" -ForegroundColor Yellow
        Write-Host "  Run: aws configure" -ForegroundColor White
    }
} catch {
    Write-Host "⚠ Could not verify AWS credentials" -ForegroundColor Yellow
    Write-Host "  Run: aws configure" -ForegroundColor White
}

Write-Host ""

