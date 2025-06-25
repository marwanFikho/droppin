#!/bin/bash

# Droppin Unified Frontend Starter Script
# This script starts the unified frontend that automatically detects device type

echo "🚀 Droppin Unified Frontend Starter"
echo "==================================="
echo ""
echo "Starting unified frontend with automatic device detection..."
echo "The app will automatically serve desktop or mobile version based on device type"
echo ""
echo "Access the app at: http://localhost:3000"
echo ""
echo "Features:"
echo "- Automatic device detection (desktop/mobile/tablet)"
echo "- Responsive design"
echo "- Single codebase for both versions"
echo "- Real-time device type switching on window resize"
echo ""

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the unified frontend
echo "Starting unified frontend..."
npm start 