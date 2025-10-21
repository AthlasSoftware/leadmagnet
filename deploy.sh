#!/bin/bash

# Athlas Lead Magnet Deployment Script
echo "🚀 Deploying Athlas Lead Magnet..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

echo "📦 Installing function dependencies..."
cd functions
npm ci
cd ..

# Build the project
echo "🔨 Building frontend..."
npm run build

# Build functions
echo "🔨 Building functions..."
cd functions
npm run build
cd ..

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your lead magnet is now live!"
    echo "📊 Monitor your deployment:"
    echo "   - Firebase Console: https://console.firebase.google.com"
    echo "   - Analytics: Check your Firebase Analytics dashboard"
    echo "   - Logs: firebase functions:log"
    echo ""
    echo "🔧 Post-deployment checklist:"
    echo "   ✓ Test lead capture form"
    echo "   ✓ Test website analysis"
    echo "   ✓ Test PDF report generation"
    echo "   ✓ Test email delivery"
    echo "   ✓ Verify GDPR compliance notices"
    echo "   ✓ Check mobile responsiveness"
    echo ""
else
    echo "❌ Deployment failed!"
    echo "Check the error messages above and try again."
    exit 1
fi
