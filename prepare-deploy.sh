#!/bin/bash
# cPanel Deployment Preparation Script
# Run this before pushing to GitHub to ensure everything is ready

echo "🚀 Starting cPanel Deployment Preparation..."
echo ""

# Step 1: Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ ERROR: Node.js version must be 18 or higher. Current: $(node -v)"
  exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Step 2: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf dist
echo "✅ Clean complete"
echo ""

# Step 3: Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 4: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Step 5: Build application
echo "🏗️  Building Next.js application..."
npm run build
echo "✅ Build complete"
echo ""

# Step 6: Verify standalone output
echo "🔍 Verifying standalone output..."
if [ -d ".next/standalone" ]; then
  echo "✅ Standalone folder exists"
  
  if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Standalone server.js exists"
  else
    echo "❌ ERROR: .next/standalone/server.js not found!"
    exit 1
  fi
  
  # Check size
  STANDALONE_SIZE=$(du -sh .next/standalone | cut -f1)
  echo "📊 Standalone folder size: $STANDALONE_SIZE"
else
  echo "❌ ERROR: .next/standalone folder not found!"
  echo "Make sure 'output: standalone' is set in next.config.mjs"
  exit 1
fi
echo ""

# Step 7: Verify server.js entry point
echo "🔍 Verifying server.js entry point..."
if [ -f "server.js" ]; then
  echo "✅ server.js exists in root"
else
  echo "❌ ERROR: server.js not found in root!"
  exit 1
fi
echo ""

# Step 8: Check environment variables
echo "🔐 Checking environment variables..."
if [ -f ".env" ]; then
  echo "✅ .env file exists"
  
  if grep -q "DATABASE_URL" .env; then
    echo "✅ DATABASE_URL is set"
  else
    echo "⚠️  WARNING: DATABASE_URL not found in .env"
  fi
  
  if grep -q "JWT_SECRET" .env; then
    echo "✅ JWT_SECRET is set"
  else
    echo "⚠️  WARNING: JWT_SECRET not found in .env"
  fi
else
  echo "❌ ERROR: .env file not found!"
  exit 1
fi
echo ""

# Step 9: Check critical files
echo "📋 Checking critical files..."
FILES_OK=true

for file in "package.json" "next.config.mjs" ".github/workflows/deploy.yml"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ ERROR: $file not found!"
    FILES_OK=false
  fi
done

if [ "$FILES_OK" = false ]; then
  exit 1
fi
echo ""

# Step 10: Summary
echo "=========================================="
echo "✅ DEPLOYMENT PREPARATION COMPLETE!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo "1. Review the build output for any errors"
echo "2. Test locally: npm start"
echo "3. Commit and push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Deploy to cPanel'"
echo "   git push origin main"
echo ""
echo "📖 See CPANEL_DEPLOYMENT_GUIDE.md for full instructions"
echo ""
