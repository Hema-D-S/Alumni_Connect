# Alumni Connect AWS Deployment Guide

## Option 1: AWS Amplify (Easiest - Recommended)

### Prerequisites

- AWS Account with Free Tier
- GitHub repository
- MongoDB Atlas account (free tier)

### Frontend Deployment Steps

1. **Prepare Frontend for Production**

   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy to Amplify**

   - Go to AWS Amplify Console
   - Click "Get Started" under "Amplify Hosting"
   - Connect your GitHub repository
   - Choose the `main` branch
   - Configure build settings:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - cd frontend
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: frontend/build
         files:
           - "**/*"
       cache:
         paths:
           - frontend/node_modules/**/*
     ```

3. **Set Environment Variables in Amplify**
   - Go to App Settings > Environment Variables
   - Add:
     ```
     REACT_APP_API_URL=https://your-backend-url
     REACT_APP_BASE_URL=https://your-backend-url
     ```

### Backend Deployment Options

#### Option A: AWS Lambda + API Gateway (Serverless)

- Convert Express app to serverless functions
- Free tier: 1M requests/month
- Very cost-effective

#### Option B: AWS EC2 Free Tier

- t2.micro instance (1 vCPU, 1GB RAM)
- 750 hours/month free
- Can run full Node.js application

## Option 2: Complete EC2 Setup

### 1. Launch EC2 Instance

```bash
# Instance type: t2.micro (Free Tier)
# AMI: Amazon Linux 2
# Security Group: Allow HTTP (80), HTTPS (443), SSH (22), Custom (5000 for your app)
```

### 2. Connect and Setup Environment

```bash
# Connect to your instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 for process management
sudo npm install -g pm2
```

### 3. Deploy Your Application

```bash
# Clone your repository
git clone https://github.com/your-username/Alumni_Connect.git
cd Alumni_Connect

# Setup backend
cd backend
npm install
npm install -g nodemon

# Setup frontend
cd ../frontend
npm install
npm run build

# Copy build files to serve from backend
cp -r build/* ../backend/public/
```

### 4. Environment Configuration

```bash
# Create .env file in backend
cd backend
nano .env
```

Add to .env:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/alumni_connect
JWT_SECRET=your-jwt-secret-key
PORT=5000
NODE_ENV=production
```

### 5. Start Application with PM2

```bash
# Start the application
pm2 start server.js --name "alumni-connect"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 6. Setup Nginx (Optional - for better performance)

```bash
# Install Nginx
sudo yum install -y nginx

# Configure Nginx
sudo nano /etc/nginx/nginx.conf
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Option 3: MongoDB Atlas Setup (Free Tier)

### 1. Create MongoDB Atlas Account

- Go to https://www.mongodb.com/cloud/atlas
- Sign up for free account
- Create new project

### 2. Create Free Cluster

- Choose "Shared" (Free tier)
- Select AWS as cloud provider
- Choose closest region
- Cluster name: "alumni-connect"

### 3. Configure Database Access

- Create database user
- Add IP whitelist (0.0.0.0/0 for development)
- Get connection string

### 4. Update Connection String

Replace in your .env:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/alumni_connect?retryWrites=true&w=majority
```

## Cost Breakdown (Free Tier)

### AWS Amplify

- ✅ Free: 1000 build minutes/month
- ✅ Free: 15GB storage
- ✅ Free: 100GB data transfer

### EC2 t2.micro

- ✅ Free: 750 hours/month
- ✅ Free: 30GB EBS storage
- ✅ Free: 15GB data transfer

### MongoDB Atlas

- ✅ Free: 512MB storage
- ✅ Free: Shared cluster

### Total Monthly Cost: $0 (within free tier limits)

## Production Considerations

### 1. Domain Setup

- Use Route 53 or external domain provider
- Setup SSL certificate with AWS Certificate Manager (free)

### 2. Security Enhancements

```bash
# Setup firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
```

### 3. Monitoring

```bash
# Setup CloudWatch logs
sudo yum install -y awslogs
```

### 4. Backup Strategy

- Use AWS S3 for file uploads
- MongoDB Atlas automatic backups

## Deployment Commands Summary

```bash
# Quick deployment script
#!/bin/bash

# Frontend build
cd frontend
npm install
npm run build

# Backend setup
cd ../backend
npm install

# Start with PM2
pm2 start server.js --name alumni-connect
pm2 save
```

## Environment Variables Checklist

### Backend (.env)

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=production
```

### Frontend (.env.production)

```env
REACT_APP_API_URL=https://your-backend-url
REACT_APP_BASE_URL=https://your-backend-url
```

## Troubleshooting

### Common Issues

1. **Port 5000 blocked**: Open security group
2. **MongoDB connection failed**: Check IP whitelist
3. **File uploads not working**: Setup S3 bucket
4. **CORS errors**: Update backend CORS configuration

### Useful Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs alumni-connect

# Restart application
pm2 restart alumni-connect

# Update application
git pull
npm install
pm2 restart alumni-connect
```
