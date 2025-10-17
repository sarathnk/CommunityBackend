# Backend Deployment Guide

## Quick Deploy Options

### 1. Railway (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

3. **Configure Environment Variables**:
   - Go to your project → Variables tab
   - Add these variables:
     ```
     DATABASE_URL=postgresql://username:password@host:port/database
     JWT_SECRET=your-super-secret-jwt-key-here
     NODE_ENV=production
     PORT=4000
     ```

4. **Set up Database**:
   - In Railway dashboard, add PostgreSQL service
   - Copy the DATABASE_URL to your environment variables
   - Run migrations: `npx prisma migrate deploy`

### 2. Render

1. **Connect Repository**:
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New" → "Web Service"
   - Connect your repository

2. **Configure Service**:
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`
   - **Environment**: Node

3. **Add Environment Variables**:
   - Add PostgreSQL database service
   - Set environment variables in Render dashboard

### 3. VPS Deployment (DigitalOcean/Linode)

1. **Set up Server**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 globally
   sudo npm install -g pm2
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   ```

2. **Deploy Application**:
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo/backend
   
   # Install dependencies
   npm install
   
   # Set up database
   sudo -u postgres createdb community_db
   # Update DATABASE_URL in .env
   
   # Run migrations
   npx prisma migrate deploy
   
   # Start with PM2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

3. **Set up Nginx** (Optional):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Variables

Create a `.env` file with these variables:

```env
# Database (use PostgreSQL for production)
DATABASE_URL="postgresql://username:password@localhost:5432/community_db"

# JWT Secret (use a strong, random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Server
PORT=4000
NODE_ENV=production

# Razorpay (if using payments)
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

# File Upload
UPLOAD_DIR="./uploads"
```

## Database Migration

For production, you'll need to migrate from SQLite to PostgreSQL:

1. **Update Prisma Schema**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Run Migration**:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## File Uploads

For production, consider using cloud storage:
- AWS S3
- Cloudinary
- DigitalOcean Spaces

Update your upload routes to use cloud storage instead of local files.

## Monitoring

- Use PM2 for process management: `pm2 monit`
- Set up logging: `pm2 logs`
- Monitor with tools like New Relic or DataDog

## Security Checklist

- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database backups
- [ ] Rate limiting
- [ ] Input validation

## Troubleshooting

1. **Database Connection Issues**:
   - Check DATABASE_URL format
   - Ensure database server is running
   - Verify credentials

2. **Port Issues**:
   - Check if PORT environment variable is set
   - Ensure port is not already in use

3. **File Upload Issues**:
   - Check upload directory permissions
   - Verify file size limits
   - Check disk space

## Support

For issues specific to this deployment, check:
- Railway: [docs.railway.app](https://docs.railway.app)
- Render: [render.com/docs](https://render.com/docs)
- DigitalOcean: [docs.digitalocean.com](https://docs.digitalocean.com)
