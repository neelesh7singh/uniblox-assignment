#!/bin/bash

# Uniblox E-commerce Server Setup Script
# This script will install dependencies and run the server

echo "🚀 Setting up Uniblox E-commerce Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="16.0.0"

if ! node -e "console.log(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION'))" 2>/dev/null; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Recommended: v16 or higher."
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but continuing with setup"
else
    echo "✅ All tests passed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev     - Start development server with hot reload"
echo "  npm start       - Start production server"
echo "  npm test        - Run test suite"
echo "  npm run build   - Build for production"
echo ""
echo "📚 API Documentation will be available at:"
echo "  http://localhost:3000/api/docs"
echo ""
echo "💚 Health check available at:"
echo "  http://localhost:3000/health"
echo ""
echo "🚀 Ready to start the server!"
echo "Run: npm run dev"
