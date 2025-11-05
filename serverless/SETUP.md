# Setup Guide - AWS SAM CLI Installation

## Prerequisites

Before deploying, you need to install AWS SAM CLI on Windows.

## Installation Options

### Option 1: Install via MSI Installer (Recommended for Windows)

1. Download the latest AWS SAM CLI installer for Windows:
   - Visit: https://github.com/aws/aws-sam-cli/releases/latest
   - Download the `.msi` file (e.g., `AWSSAMCLI-Setup-1.x.x.msi`)

2. Run the installer and follow the installation wizard

3. Verify installation:
   ```powershell
   sam --version
   ```

### Option 2: Install via Chocolatey

If you have Chocolatey installed:

```powershell
choco install aws-sam-cli
```

### Option 3: Install via pip (Python required)

If you have Python 3.8+ installed:

```powershell
pip install aws-sam-cli
```

## Verify Installation

After installation, restart your terminal and verify:

```powershell
sam --version
```

You should see something like: `SAM CLI, version 1.x.x`

## Additional Requirements

### AWS CLI

Make sure AWS CLI is installed and configured:

```powershell
aws --version
```

If not installed:
```powershell
# Via MSI installer
# Download from: https://aws.amazon.com/cli/

# Or via Chocolatey
choco install awscli
```

### Configure AWS Credentials

```powershell
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

## Node.js

Ensure Node.js 20.x is installed (for Lambda functions):

```powershell
node --version
```

If not installed, download from: https://nodejs.org/

## Quick Test

After installation, test SAM CLI:

```powershell
sam --version
sam validate --template template.yaml
```

## Troubleshooting

### SAM command not found after installation

1. Restart your terminal/PowerShell
2. Check if SAM is in your PATH:
   ```powershell
   $env:PATH
   ```
3. Manually add SAM to PATH if needed (usually installed to `C:\Program Files\Amazon\AWSSAMCLI\bin`)

### Permission Issues

Run PowerShell as Administrator if you encounter permission errors.

## Next Steps

Once SAM CLI is installed:

1. Build the project:
   ```powershell
   sam build
   ```

2. Deploy:
   ```powershell
   sam deploy --guided
   ```

For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md)

