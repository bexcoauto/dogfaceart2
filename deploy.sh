#!/bin/bash

echo "🚀 Deploying Dog Face Art App to Render.com"
echo "============================================="

# Check if we have all required environment variables
echo "📋 Checking environment variables..."

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY is not set"
    exit 1
fi

if [ -z "$SHOPIFY_API_KEY" ]; then
    echo "❌ SHOPIFY_API_KEY is not set"
    exit 1
fi

if [ -z "$SHOPIFY_API_SECRET" ]; then
    echo "❌ SHOPIFY_API_SECRET is not set"
    exit 1
fi

echo "✅ All environment variables are set"

# Build the app
echo "🔨 Building the app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Start the app
echo "🚀 Starting the app..."
npm run start
