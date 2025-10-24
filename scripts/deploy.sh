#!/bin/bash

# Deployment script for spa-admin-firebase
# This script builds and deploys the application to Firebase Hosting

set -e

echo "🚀 Starting deployment process..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
echo "📋 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1 || {
    echo "❌ Not logged in to Firebase. Please run: firebase login"
    exit 1
}

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build the application
echo "🔨 Building application..."
pnpm run build

# Check build success
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Display build size
echo "📊 Build size:"
du -sh dist
echo ""

# Deploy to Firebase
echo "🚢 Deploying to Firebase..."

# Ask for deployment type
echo "Select deployment type:"
echo "1) Hosting only"
echo "2) Hosting + Firestore rules"
echo "3) Full deployment (Hosting + Firestore rules + indexes)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        firebase deploy --only hosting
        ;;
    2)
        firebase deploy --only hosting,firestore:rules
        ;;
    3)
        firebase deploy --only hosting,firestore:rules,firestore:indexes
        ;;
    *)
        echo "Invalid choice. Deploying hosting only..."
        firebase deploy --only hosting
        ;;
esac

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your app is live at: https://spa-admin-firebase.web.app"
