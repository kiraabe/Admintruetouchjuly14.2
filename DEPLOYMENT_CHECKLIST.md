# True Touch - Deployment Checklist

Complete this checklist before deploying to production on Render.

## Pre-Deployment Setup

- [ ] Review and update `.env.example` with all required variables
- [ ] Set up a PostgreSQL database (Render provides free tier)
- [ ] Obtain Firebase credentials from Firebase Console
- [ ] Generate secure JWT_SECRET (use: `openssl rand -base64 32`)
- [ ] Test build locally: `npm run build:production`
- [ ] Test start locally: `npm run start:production`

## GitHub Repository

- [ ] Push all changes to GitHub repository
- [ ] Ensure the deployment branch exists and is up-to-date
- [ ] Verify `.env` is in `.gitignore` (don't commit secrets)
- [ ] Check that all config files are committed:
  - [ ] `render.yaml`
  - [ ] `Dockerfile`
  - [ ] `package.json` with production scripts
  - [ ] `vite.config.ts` with correct output directory
  - [ ] `.env.example`

## Render Configuration

### Create Database
- [ ] Create PostgreSQL database on Render
- [ ] Note the Internal Database URL
- [ ] Ensure database is in same region as web service

### Create Web Service
- [ ] Name: `truetouch-app`
- [ ] Environment: Node
- [ ] Region: Same as database
- [ ] Build Command: `npm run build:production`
- [ ] Start Command: `npm run start:production`

### Environment Variables
Set these in Render dashboard:
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL=<internal_postgres_url>`
- [ ] `VITE_API_BASE_URL=https://your-app.onrender.com/api`
- [ ] `CORS_ORIGIN=https://your-app.onrender.com`
- [ ] `JWT_SECRET=<generated_secret>`
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] All Firebase variables from `.env.example`

## Post-Deployment Verification

- [ ] Application deployed successfully (check Render logs)
- [ ] Frontend loads without errors
- [ ] Database connection established
- [ ] Health check passes: `https://your-app.onrender.com/health`
- [ ] Sign-in page loads correctly
- [ ] Can log in with test credentials
- [ ] API endpoints respond correctly
- [ ] File uploads work properly
- [ ] Images load correctly
- [ ] Dark mode toggle works
- [ ] Search functionality works

## Performance Monitoring

- [ ] Monitor Render dashboard for resource usage
- [ ] Check application logs for errors
- [ ] Set up Render alerts for failures
- [ ] Test load times and responsiveness
- [ ] Verify database queries are efficient

## Security Checklist

- [ ] Environment variables are not exposed in logs
- [ ] Sensitive data is marked as private in Render
- [ ] CORS_ORIGIN is set to production domain only
- [ ] JWT_SECRET is strong and unique
- [ ] Database has proper access controls
- [ ] No console.log statements with sensitive data
- [ ] HTTPS is enforced (Render provides automatically)
- [ ] Authentication tokens are secure

## Database Maintenance

- [ ] Initial migration completed
- [ ] Tables created successfully
- [ ] Admin user created
- [ ] Database backups enabled (Render settings)
- [ ] Connection pooling optimized

## Ongoing Maintenance

- [ ] Set up automated backups
- [ ] Monitor application logs regularly
- [ ] Plan for scaling if needed
- [ ] Keep dependencies updated
- [ ] Review and rotate JWT_SECRET periodically
- [ ] Test disaster recovery procedures

## Troubleshooting Guide

### Build Fails
1. Check Render build logs
2. Run `npm run build:production` locally to test
3. Verify all environment variables are set
4. Check for TypeScript errors

### Application Crashes
1. Check Render application logs
2. Verify DATABASE_URL is correct
3. Check database is running
4. Review recent code changes

### Database Connection Error
1. Verify DATABASE_URL format
2. Check PostgreSQL service status
3. Ensure web service and database in same region
4. Test connection string locally

### Static Assets Not Loading
1. Verify Vite build completed
2. Check `dist/public` exists with built files
3. Check express is serving static files
4. Verify correct output directory in vite.config.ts

### API Requests Failing
1. Check CORS_ORIGIN matches frontend URL
2. Verify API endpoints in logs
3. Check database connectivity
4. Review request/response in browser DevTools

## Rollback Procedure

If issues occur in production:

1. Go to Render Dashboard
2. Navigate to your Web Service
3. Go to **Deploys** tab
4. Click the three-dots menu on previous successful deploy
5. Click **Redeploy**

This will restore the previous working version.

## Documentation

- See `RENDER_DEPLOYMENT.md` for detailed setup instructions
- See `MONOREPO_SETUP.md` for backend development details
- See `README.md` for project overview

## Support Contacts

- **Render Support**: https://support.render.com
- **GitHub Issues**: Create issues in your repository
- **Firebase Support**: https://firebase.google.com/support
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## Final Notes

- Keep this checklist updated as your deployment changes
- Document any custom configurations specific to your setup
- Maintain a deployment log for future reference
- Review logs regularly for potential issues
