# 🚀 Deployment Guide for Dog Face Art App

## Current Status
✅ **Local Development**: Working perfectly with Cloudflare tunnel  
✅ **Environment Variables**: All configured correctly  
✅ **App Extensions**: Deployed to Shopify  
⚠️ **Production Web App**: Needs deployment  

## Option 1: Render.com (Recommended - Free Tier)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Create a new account

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the `dogfaceart2` repository

### Step 3: Configure the Service
- **Name**: `dogfaceart2`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Plan**: Free

### Step 4: Set Environment Variables
Add these environment variables in Render dashboard:

```
NODE_ENV=production
OPENAI_API_KEY=your-openai-api-key-here
SHOPIFY_API_KEY=your-shopify-api-key-here
SHOPIFY_API_SECRET=your-shopify-api-secret-here
SCOPES=read_files,read_orders,read_products,write_files,write_orders,write_products
SHOPIFY_DOG_FACE_LINE_ART_ID=your-app-id-here
SHOPIFY_APP_URL=https://your-app-name.onrender.com
DATABASE_URL=postgresql://username:password@host:port/database
```

### Step 5: Add PostgreSQL Database
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name it `dogfaceart2-db`
3. Copy the connection string to `DATABASE_URL` environment variable

### Step 6: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy the provided URL (e.g., `https://dogfaceart2.onrender.com`)

### Step 7: Update Shopify App URL
1. Go to your Shopify Partner Dashboard
2. Update the app's URL to your new Render URL
3. Update the redirect URLs in your app settings

## Environment Variables Summary

Here are all the variables you need for production:

```bash
NODE_ENV=production
OPENAI_API_KEY=your-openai-api-key-here
SHOPIFY_API_KEY=your-shopify-api-key-here
SHOPIFY_API_SECRET=your-shopify-api-secret-here
SCOPES=read_files,read_orders,read_products,write_files,write_orders,write_products
SHOPIFY_DOG_FACE_LINE_ART_ID=your-app-id-here
SHOPIFY_APP_URL=https://your-production-url.com
DATABASE_URL=postgresql://username:password@host:port/database
```

## Next Steps

1. **Choose a hosting platform** (Render.com recommended)
2. **Deploy your app** following the steps above
3. **Update your Shopify app settings** with the new production URL
4. **Test the deployment** by visiting your app URL
5. **Update your theme app extension** to use the production URL

## Support

If you run into any issues:
1. Check the deployment logs in your hosting platform
2. Verify all environment variables are set correctly
3. Make sure your database is properly configured
4. Test the app endpoints manually

Your app is already working perfectly locally, so deployment should be straightforward! 🎉
