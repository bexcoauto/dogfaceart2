#!/bin/sh

# Set default port if not provided
export PORT=${PORT:-3000}

echo "Starting app on port $PORT"

# Run database setup
echo "Running database migrations..."
echo "Database URL: $DATABASE_URL"
npx prisma migrate deploy --accept-data-loss
echo "Database migrations completed."
echo "Verifying database connection..."
npx prisma db push --accept-data-loss
echo "Database setup completed."

# Start the app
exec npx remix-serve ./build/server/index.js --port $PORT
