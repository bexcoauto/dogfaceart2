#!/bin/sh

# Set default port if not provided
export PORT=${PORT:-3000}

echo "Starting app on port $PORT"

# Run database setup
npm run setup

# Start the app
exec remix-serve ./build/server/index.js --port $PORT
