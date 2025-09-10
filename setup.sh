#!/bin/bash

# Uniblox E-commerce Platform Setup Script
# This script will install dependencies and set up both client and server
# Usage: ./setup.sh [--skip-tests]

set -e  # Exit on any error

# Check for skip-tests flag
SKIP_TESTS=false
if [[ "$1" == "--skip-tests" ]]; then
    SKIP_TESTS=true
fi

echo "🚀 Setting up Uniblox E-commerce Platform..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v16 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="16.0.0"

if ! node -e "console.log(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION'))" 2>/dev/null; then
    print_warning "Node.js version $NODE_VERSION detected. Recommended: v16 or higher."
fi

print_success "Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "npm version: $(npm -v)"

echo ""
print_status "Installing root dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install root dependencies"
    exit 1
fi

print_success "Root dependencies installed successfully"

echo ""
print_status "Installing workspace dependencies..."
npm run install:all

if [ $? -ne 0 ]; then
    print_error "Failed to install workspace dependencies"
    exit 1
fi

print_success "All workspace dependencies installed successfully"

echo ""
print_status "Building server..."
npm run build:server

if [ $? -ne 0 ]; then
    print_error "Server build failed"
    exit 1
fi

print_success "Server built successfully"

echo ""
print_status "Building client..."
npm run build:client

if [ $? -ne 0 ]; then
    print_error "Client build failed"
    exit 1
fi

print_success "Client built successfully"

echo ""
print_success "🎉 Setup complete!"