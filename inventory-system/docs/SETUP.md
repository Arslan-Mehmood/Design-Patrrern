# Setup Guide - Local Development

This guide helps you set up the inventory system for local development.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Angular CLI (will be installed via npm)

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Install Angular CLI globally (if not already installed)
npm install -g @angular/cli

# Start development server
ng serve

# The frontend will be available at http://localhost:4200
```

## Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# The backend will be available at http://localhost:3000
```

## Docker Build (Local Testing)

### Frontend
```bash
cd frontend
docker build -t inventory-frontend:local .
docker run -p 8080:80 inventory-frontend:local
```

### Backend
```bash
cd backend
docker build -t inventory-backend:local .
docker run -p 3000:3000 inventory-backend:local
```

## Testing the API

```bash
# Health check
curl http://localhost:3000/health

# Get all inventory items
curl http://localhost:3000/api/inventory

# Get single item
curl http://localhost:3000/api/inventory/1

# Create new item
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"name":"Tablet","quantity":15,"price":499.99}'
```

## Environment Variables

### Backend
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Frontend
The frontend uses environment variables at build time. To configure the API URL, you can:
1. Update `src/app/components/inventory-list/inventory-list.component.ts`
2. Use Angular environment files
3. Use runtime configuration via nginx

