# Alumni Connect AWS Deployment Script for Windows
# PowerShell version

Write-Host "🚀 Alumni Connect AWS Deployment Helper" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json") -and -not (Test-Path "frontend") -and -not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the Alumni_Connect root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Pre-deployment checklist:" -ForegroundColor Yellow
Write-Host "1. ✅ AWS EC2 instance created (t2.micro)"
Write-Host "2. ✅ Security groups configured (SSH:22, HTTP:80, Custom:5000)"
Write-Host "3. ✅ MongoDB Atlas cluster created"
Write-Host "4. ✅ SSH key pair downloaded"
Write-Host ""

# Function to build frontend
function Build-Frontend {
    Write-Host "🔨 Building frontend..." -ForegroundColor Blue
    Set-Location frontend
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    Write-Host "🏗️ Building React app..." -ForegroundColor Blue
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
}

# Function to prepare backend
function Prepare-Backend {
    Write-Host "⚙️ Preparing backend..." -ForegroundColor Blue
    Set-Location backend
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Create production environment file template
    if (-not (Test-Path ".env.production")) {
        Write-Host "📝 Creating .env.production template..." -ForegroundColor Yellow
        
        $envContent = @"
# Production Environment Variables
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/alumni_connect?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=production

# Replace with your actual values:
# 1. Get MONGO_URI from MongoDB Atlas
# 2. Generate a secure JWT_SECRET
# 3. Update other settings as needed
"@
        
        $envContent | Out-File -FilePath ".env.production" -Encoding UTF8
        Write-Host "📄 .env.production created! Please update with your actual values." -ForegroundColor Green
    }
    
    Set-Location ..
    Write-Host "✅ Backend preparation complete!" -ForegroundColor Green
}

# Function to create deployment package
function Create-DeploymentPackage {
    Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
    
    # Create deployment directory
    if (Test-Path "deploy") {
        Remove-Item -Recurse -Force "deploy"
    }
    New-Item -ItemType Directory -Name "deploy"
    
    # Copy backend files
    Copy-Item -Recurse "backend" "deploy/"
    
    # Copy frontend build to backend public directory
    if (Test-Path "frontend/build") {
        New-Item -ItemType Directory -Path "deploy/backend/public" -Force
        Copy-Item -Recurse "frontend/build/*" "deploy/backend/public/"
        Write-Host "✅ Frontend files copied to backend public directory" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend build not found! Please build frontend first." -ForegroundColor Red
        exit 1
    }
    
    # Create start script
    $startScript = @"
#!/bin/bash
# Start script for Alumni Connect

echo "🚀 Starting Alumni Connect..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Copy environment file
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Environment variables loaded"
else
    echo "⚠️ Warning: .env.production not found"
fi

# Start application
pm2 start server.js --name "alumni-connect"
pm2 save
pm2 startup

echo "✅ Alumni Connect started successfully!"
echo "🌐 Application should be running on port 5000"
"@
    
    $startScript | Out-File -FilePath "deploy/start.sh" -Encoding UTF8
    
    # Create update script
    $updateScript = @"
#!/bin/bash
# Update script for Alumni Connect

echo "🔄 Updating Alumni Connect..."

# Pull latest changes
git pull origin main

# Rebuild if needed
if [ -f "../frontend/package.json" ]; then
    echo "🔨 Rebuilding frontend..."
    cd ../frontend
    npm install
    npm run build
    cp -r build/* ../backend/public/
    cd ../backend
fi

# Restart application
pm2 restart alumni-connect

echo "✅ Alumni Connect updated successfully!"
"@
    
    $updateScript | Out-File -FilePath "deploy/update.sh" -Encoding UTF8
    
    # Create archive (if 7-Zip is available)
    if (Get-Command "7z" -ErrorAction SilentlyContinue) {
        Set-Location deploy
        & 7z a ../alumni-connect-deployment.zip .
        Set-Location ..
        Write-Host "✅ Deployment package created: alumni-connect-deployment.zip" -ForegroundColor Green
    } else {
        Compress-Archive -Path "deploy/*" -DestinationPath "alumni-connect-deployment.zip" -Force
        Write-Host "✅ Deployment package created: alumni-connect-deployment.zip" -ForegroundColor Green
    }
}

# Function to show deployment instructions
function Show-DeploymentInstructions {
    Write-Host ""
    Write-Host "🎯 Next Steps - Deploy to AWS EC2:" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Upload the deployment package to your EC2 instance:"
    Write-Host "   scp -i your-key.pem alumni-connect-deployment.zip ec2-user@your-instance-ip:~/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Connect to your EC2 instance:"
    Write-Host "   ssh -i your-key.pem ec2-user@your-instance-ip" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. On the EC2 instance, run these commands:"
    Write-Host "   # Install Node.js" -ForegroundColor Yellow
    Write-Host "   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -" -ForegroundColor Cyan
    Write-Host "   sudo yum install -y nodejs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   # Extract and setup application" -ForegroundColor Yellow
    Write-Host "   unzip alumni-connect-deployment.zip" -ForegroundColor Cyan
    Write-Host "   cd backend" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   # Update .env.production with your actual values" -ForegroundColor Yellow
    Write-Host "   nano .env.production" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   # Start the application" -ForegroundColor Yellow
    Write-Host "   chmod +x start.sh" -ForegroundColor Cyan
    Write-Host "   ./start.sh" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. Open security group to allow traffic on port 5000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "5. Access your application at: http://your-instance-ip:5000" -ForegroundColor Green
}

# Function to show AWS Amplify instructions
function Show-AmplifyInstructions {
    Write-Host ""
    Write-Host "🎯 Alternative: Deploy with AWS Amplify (Easier):" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Push your code to GitHub" -ForegroundColor Yellow
    Write-Host "2. Go to AWS Amplify Console" -ForegroundColor Yellow
    Write-Host "3. Click 'New App' > 'Host web app'" -ForegroundColor Yellow
    Write-Host "4. Connect your GitHub repository" -ForegroundColor Yellow
    Write-Host "5. Configure build settings:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Build commands:" -ForegroundColor Cyan
    Write-Host "   ---------------"
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host "   npm install" -ForegroundColor Gray
    Write-Host "   npm run build" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Build output directory: frontend/build" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "6. Add environment variables in Amplify console" -ForegroundColor Yellow
    Write-Host "7. Deploy!" -ForegroundColor Yellow
}

# Main execution
Write-Host "Choose deployment method:" -ForegroundColor Yellow
Write-Host "1. AWS EC2 (Full control)"
Write-Host "2. AWS Amplify (Frontend only, easier)"
Write-Host "3. Just build and prepare files"
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Build-Frontend
        Prepare-Backend
        Create-DeploymentPackage
        Show-DeploymentInstructions
    }
    "2" {
        Build-Frontend
        Show-AmplifyInstructions
    }
    "3" {
        Build-Frontend
        Prepare-Backend
        Write-Host "✅ Files prepared! Check frontend/build and backend directories." -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
Write-Host "💡 Need help? Check the deployment-guide.md file for detailed instructions." -ForegroundColor Blue