#!/bin/bash

# Content Verification System - GitHub Setup Script
# Run this script to initialize git and prepare for GitHub push

echo "🚀 Setting up Git repository..."

# Navigate to project directory
cd /Users/shubhamjoshi/MountainTop/content-verify

# Install serve package
echo "📦 Installing dependencies..."
npm install

# Initialize git repository
echo "🔧 Initializing Git..."
git init

# Add all files to git
echo "📝 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Content Verification System with dynamic keyword analysis and role-based workflow"

echo ""
echo "✅ Git repository initialized successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub (https://github.com/new)"
echo "   - Name it: content-verify"
echo "   - Don't initialize with README"
echo ""
echo "2. Run these commands (replace YOUR_USERNAME with your GitHub username):"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/content-verify.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy on Railway:"
echo "   - Go to https://railway.app"
echo "   - Click 'New Project' → 'Deploy from GitHub repo'"
echo "   - Select your content-verify repository"
echo "   - Railway will auto-deploy!"
echo ""
