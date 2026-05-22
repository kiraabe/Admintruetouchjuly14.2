# True Touch - Render Deployment Guide

This guide will help you deploy the True Touch application to Render.com.

## Prerequisites

1. A Render account (https://render.com)
2. A GitHub repository with this code
3. A PostgreSQL database (Render provides free tier)
4. Firebase credentials (if using Firebase)

## Deployment Steps

### 1. Create a PostgreSQL Database on Render

1. Log in to Render.com
2. Go to **Dashboard** → **New** → **PostgreSQL**
3. Enter database details:
   - **Name**: `truetouch-db`
   - **PostgreSQL Version**: 17
   - **Region**: Select your closest region
   - **Datadog API Key**: Leave blank
4. Click **Create Database**
5. Copy the **Internal Database URL** (you'll need this)

### 2. Connect Your GitHub Repository

1. Go to **Dashboard** → **New** → **Web Service**
2. Connect your GitHub account if not already connected
3. Select the `Admintruetouchmay22.4` repository
4. Choose the correct branch (e.g., `ai_main_88ce8f9a96b24970a646`)

### 3. Configure the Web Service

**Basic Settings:**
- **Name**: `truetouch-app`
- **Environment**: Node
- **Region**: Same as your database
- **Branch**: Your deployment branch
- **Build Command**: 
  ```
  npm run build:production
  ```
- **Start Command**: 
  ```
  npm run start:production
  ```

**Environment Variables:**

Click **Advanced** → **Environment** and add these variables:

```
NODE_ENV=production
PORT=3000
VITE_API_BASE_URL=https://YOUR_RENDER_URL/api
CORS_ORIGIN=https://YOUR_RENDER_URL

# Database (use the Internal URL from step 1)
DATABASE_URL=postgresql://user:password@host/database

# Firebase (get these from your Firebase console)
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# JWT Configuration
JWT_SECRET=your_random_secret_key_here_make_it_strong
JWT_EXPIRES_IN=7d
```

### 4. Create the Service

1. Click **Create Web Service**
2. Render will automatically deploy your application
3. Monitor the build in the **Logs** tab
4. Once deployed, you'll get a URL like `https://truetouch-app.onrender.com`

## Database Setup

### Initial Database Migration

After your service is deployed, you need to run the initial database setup:

1. SSH into your Render Web Service or use Render's shell
2. Run migrations (if you have any):
   ```
   npm run migrate
   ```

### Create Initial Admin User

Once the database is ready, create your first admin user:

1. Access your application at `https://truetouch-app.onrender.com`
2. Use the sign-up flow to create an admin account
3. Or use the backend API to create a user

## Monitoring

### Check Logs
- Go to your Web Service → **Logs** tab to view application logs

### Check Database
- Go to your PostgreSQL database → **Info** tab to see connection details

### Monitor Performance
- Use Render's **Dashboard** to see resource usage
- Set up alerts for failures

## Troubleshooting

### Build Fails
1. Check the build logs in Render dashboard
2. Ensure all environment variables are set correctly
3. Verify `npm run build:production` works locally

### Application Crashes
1. Check the **Logs** tab in Render
2. Verify DATABASE_URL is correct
3. Check that all environment variables are set
4. Ensure PostgreSQL is running and accessible

### Database Connection Error
1. Verify DATABASE_URL is copied correctly
2. Make sure the PostgreSQL service is running
3. Check that your Web Service and Database are in the same region

### Static Assets Not Loading
1. Verify the frontend build completed successfully
2. Check that Vite built files exist in `dist/` directory
3. Ensure express serves static files from `dist/` directory

## Updating Your Application

To deploy updates:

1. Push changes to your GitHub repository
2. Render will automatically trigger a new deployment
3. Monitor the build in the **Logs** tab
4. Your updated application will be live once the build completes

## Scaling

### Increase Resources
1. Go to your Web Service → **Settings**
2. Update the **Instance Type** (free tier has limitations)
3. Changes take effect on next deployment

### Multiple Environments
To create staging/testing environments:
1. Create a new Web Service pointing to a different branch
2. Use a separate database for testing

## Cost Optimization

- **Free Tier**: Limited resources, auto-sleep after inactivity
- **Paid Tiers**: More reliable, better performance
- **Database**: Free PostgreSQL included with free plan (limited storage)

For production use, consider upgrading to a paid plan.

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Environment Variables on Render](https://render.com/docs/environment-variables)

## Support

For issues with Render deployment, refer to:
- [Render Status Page](https://status.render.com)
- [Render Community](https://community.render.com)
