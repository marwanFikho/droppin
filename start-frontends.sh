#!/bin/bash

# Droppin Frontend Starter Script
# This script helps you start either the desktop or mobile frontend

echo "🚀 Droppin Frontend Starter"
echo "=========================="
echo ""
echo "Choose which frontend to start:"
echo "1. Desktop Frontend (http://localhost:3000)"
echo "2. Mobile Frontend (http://localhost:3001)"
echo "3. Both Frontends"
echo "4. Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "Starting Desktop Frontend..."
        cd frontend
        npm start
        ;;
    2)
        echo "Starting Mobile Frontend..."
        cd mobile-frontend
        PORT=3001 npm start
        ;;
    3)
        echo "Starting Both Frontends..."
        echo "Desktop: http://localhost:3000"
        echo "Mobile: http://localhost:3001"
        echo ""
        echo "Starting Desktop Frontend in background..."
        cd frontend
        npm start &
        DESKTOP_PID=$!
        
        echo "Starting Mobile Frontend..."
        cd ../mobile-frontend
        PORT=3001 npm start &
        MOBILE_PID=$!
        
        echo "Both frontends are running!"
        echo "Press Ctrl+C to stop both"
        
        # Wait for user to stop
        trap "kill $DESKTOP_PID $MOBILE_PID; exit" INT
        wait
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac 