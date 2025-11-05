# Installing AWS SAM CLI on Windows

## Option 1: Using the MSI Installer (Recommended)

1. Download the latest AWS SAM CLI installer:
   - Visit: https://github.com/aws/aws-sam-cli/releases/latest
   - Download the `.msi` file (e.g., `AWSSAMCLI-64.msi`)

2. Run the installer and follow the installation wizard

3. Restart your PowerShell/terminal

4. Verify installation:
   ```powershell
   sam --version
   ```

## Option 2: Using Chocolatey

If you have Chocolatey installed:

```powershell
choco install aws-sam-cli
```

## Option 3: Using pip (if Python is installed)

```powershell
pip install aws-sam-cli
```

## Prerequisites

Before installing SAM CLI, ensure you have:

1. **AWS CLI** installed:
   ```powershell
   # Check if AWS CLI is installed
   aws --version
   
   # If not installed, download from:
   # https://aws.amazon.com/cli/
   ```

2. **Docker Desktop** (for local testing - optional but recommended):
   - Download from: https://www.docker.com/products/docker-desktop
   - Required for `sam local` commands

3. **Node.js 20.x** (already needed for your Lambda functions):
   ```powershell
   node --version
   ```

## Verify Installation

After installation, open a new PowerShell window and run:

```powershell
sam --version
aws --version
```

Both commands should return version numbers.

## Configure AWS Credentials

After installing AWS CLI, configure your credentials:

```powershell
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

## Next Steps

Once SAM CLI is installed, you can proceed with:

```powershell
sam build
sam deploy --guided
```

