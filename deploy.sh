#!/bin/bash

# Alumni Connect AWS Deployment Script
# This script helps deploy your application to AWS EC2

echo "🚀 Alumni Connect AWS Deployment Helper"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the Alumni_Connect root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "1. ✅ AWS EC2 instance created (t2.micro)"
echo "2. ✅ Security groups configured (SSH:22, HTTP:80, Custom:5000)"
echo "3. ✅ MongoDB Atlas cluster created"
echo "4. ✅ SSH key pair downloaded"
echo ""

# Function to build frontend
build_frontend() {
    echo "🔨 Building frontend..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    echo "🏗️ Building React app..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend build successful!"
    else
        echo "❌ Frontend build failed!"
        exit 1
    fi
    cd ..
}

# Function to prepare backend
prepare_backend() {
    echo "⚙️ Preparing backend..."
    cd backend
    
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    # Create production environment file template
    if [ ! -f ".env.production" ]; then
        echo "📝 Creating .env.production template..."
        cat > .env.production << EOL
# Production Environment Variables
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/alumni_connect?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=production

# Replace with your actual values:
# 1. Get MONGO_URI from MongoDB Atlas
# 2. Generate a secure JWT_SECRET
# 3. Update other settings as needed
EOL
        echo "📄 .env.production created! Please update with your actual values."
    fi
    
    cd ..
    echo "✅ Backend preparation complete!"
}

# Function to create deployment package
create_deployment_package() {
    echo "📦 Creating deployment package..."
    
    # Create deployment directory
    rm -rf deploy
    mkdir deploy
    
    # Copy backend files
    cp -r backend deploy/
    
    # Copy frontend build to backend public directory
    if [ -d "frontend/build" ]; then
        mkdir -p deploy/backend/public
        cp -r frontend/build/* deploy/backend/public/
        echo "✅ Frontend files copied to backend public directory"
    else
        echo "❌ Frontend build not found! Please build frontend first."
        exit 1
    fi
    
    # Create deployment scripts
    cat > deploy/start.sh << 'EOL'
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
EOL

    chmod +x deploy/start.sh
    
    # Create update script
    cat > deploy/update.sh << 'EOL'
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
EOL

    chmod +x deploy/update.sh
    
    # Create archive
    cd deploy
    tar -czf ../alumni-connect-deployment.tar.gz .
    cd ..
    
    echo "✅ Deployment package created: alumni-connect-deployment.tar.gz"
}

# Function to show deployment instructions
show_deployment_instructions() {
    echo ""
    echo "🎯 Next Steps - Deploy to AWS EC2:"
    echo "=================================="
    echo ""
    echo "1. Upload the deployment package to your EC2 instance:"
    echo "   scp -i your-key.pem alumni-connect-deployment.tar.gz ec2-user@your-instance-ip:~/"
    echo ""
    echo "2. Connect to your EC2 instance:"
    echo "   ssh -i your-key.pem ec2-user@your-instance-ip"
    echo ""
    echo "3. On the EC2 instance, run these commands:"
    echo "   # Install Node.js"
    echo "   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -"
    echo "   sudo yum install -y nodejs"
    echo ""
    echo "   # Extract and setup application"
    echo "   tar -xzf alumni-connect-deployment.tar.gz"
    echo "   cd backend"
    echo ""
    echo "   # Update .env.production with your actual values"
    echo "   nano .env.production"
    echo ""
    echo "   # Start the application"
    echo "   ./start.sh"
    echo ""
    echo "4. Open security group to allow traffic on port 5000"
    echo ""
    echo "5. Access your application at: http://your-instance-ip:5000"
    echo ""
    echo "🔧 Additional Setup (Optional):"
    echo "- Setup Nginx as reverse proxy"
    echo "- Configure domain name"
    echo "- Setup SSL certificate"
    echo ""
}

# Function to show AWS Amplify instructions
show_amplify_instructions() {
    echo ""
    echo "🎯 Alternative: Deploy with AWS Amplify (Easier):"
    echo "================================================"
    echo ""
    echo "1. Push your code to GitHub"
    echo "2. Go to AWS Amplify Console"
    echo "3. Click 'New App' > 'Host web app'"
    echo "4. Connect your GitHub repository"
    echo "5. Configure build settings:"
    echo ""
    echo "   Build commands:"
    echo "   ---------------"
    echo "   cd frontend"
    echo "   npm install"
    echo "   npm run build"
    echo ""
    echo "   Build output directory: frontend/build"
    echo ""
    echo "6. Add environment variables in Amplify console"
    echo "7. Deploy!"
    echo ""
    echo "For backend, you can use:"
    echo "- AWS Lambda + API Gateway (serverless)"
    echo "- Railway, Heroku, or Render (easier)"
    echo ""
}

# Main execution
echo "Choose deployment method:"
echo "1. AWS EC2 (Full control)"
echo "2. AWS Amplify (Frontend only, easier)"
echo "3. Just build and prepare files"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        build_frontend
        prepare_backend
        create_deployment_package
        show_deployment_instructions
        ;;
    2)
        build_frontend
        show_amplify_instructions
        ;;
    3)
        build_frontend
        prepare_backend
        echo "✅ Files prepared! Check frontend/build and backend directories."
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment preparation complete!"
echo "💡 Need help? Check the deployment-guide.md file for detailed instructions."