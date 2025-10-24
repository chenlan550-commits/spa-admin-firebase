# PowerShell deployment script for spa-admin-firebase
# This script builds and deploys the application to Firebase Hosting

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if Firebase CLI is installed
try {
    $null = Get-Command firebase -ErrorAction Stop
} catch {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
}

# Check if logged in to Firebase
Write-Host "📋 Checking Firebase authentication..." -ForegroundColor Cyan
try {
    firebase projects:list | Out-Null
} catch {
    Write-Host "❌ Not logged in to Firebase. Please run: firebase login" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install --frozen-lockfile

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Cyan
pnpm run build

# Check build success
if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed - dist directory not found" -ForegroundColor Red
    exit 1
}

# Display build size
Write-Host "📊 Build size:" -ForegroundColor Cyan
$size = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "$([math]::Round($size, 2)) MB"
Write-Host ""

# Deploy to Firebase
Write-Host "🚢 Deploying to Firebase..." -ForegroundColor Green

# Ask for deployment type
Write-Host "Select deployment type:" -ForegroundColor Yellow
Write-Host "1) Hosting only"
Write-Host "2) Hosting + Firestore rules"
Write-Host "3) Full deployment (Hosting + Firestore rules + indexes)"
$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        firebase deploy --only hosting
    }
    "2" {
        firebase deploy --only hosting,firestore:rules
    }
    "3" {
        firebase deploy --only hosting,firestore:rules,firestore:indexes
    }
    default {
        Write-Host "Invalid choice. Deploying hosting only..." -ForegroundColor Yellow
        firebase deploy --only hosting
    }
}

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your app is live at: https://spa-admin-firebase.web.app" -ForegroundColor Cyan
