#!/bin/bash

echo "🏫 Room Booking Web App - Quick Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"
echo ""

# Check if PostgreSQL is installed or Docker is available
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found"
    USE_DOCKER=false
elif command -v docker &> /dev/null; then
    echo "✅ Docker found - will use Docker for PostgreSQL"
    USE_DOCKER=true
else
    echo "⚠️  Neither PostgreSQL nor Docker found."
    echo "Please install one:"
    echo "  - PostgreSQL: https://www.postgresql.org/download/"
    echo "  - Docker: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

echo ""
read -p "Continue with setup? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Backend setup
echo "→ Backend setup..."
cd backend
npm install
cp .env.example .env
echo "✅ Backend dependencies installed"
echo ""
echo "⚠️  Edit backend/.env with your PostgreSQL credentials"
echo ""

cd ..

# Frontend setup
echo "→ Frontend setup..."
cd frontend
npm install
cp .env.example .env
echo "✅ Frontend dependencies installed"
echo ""

cd ..

# Database setup instructions
echo ""
echo "🗄️  Database Setup Instructions:"
echo "============================"
if [ "$USE_DOCKER" = true ]; then
    echo ""
    echo "1. Start PostgreSQL container:"
    echo "   docker-compose up -d"
    echo ""
    echo "2. Initialize database:"
    echo "   cd backend"
    echo "   npm run setup-db"
    echo ""
else
    echo ""
    echo "1. Create database:"
    echo "   createdb room_booking"
    echo ""
    echo "2. Initialize tables:"
    echo "   cd backend"
    echo "   npm run setup-db"
    echo ""
fi

echo ""
echo "🚀 Starting the Application:"
echo "=========================="
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Then open http://localhost:3000 in your browser!"
echo ""
echo "📖 For more details, see README.md"
