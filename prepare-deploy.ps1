# cPanel Deployment Preparation Script (PowerShell)
# Run this before pushing to GitHub to ensure everything is ready

Write-Host "🚀 Starting cPanel Deployment Preparation..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node version
Write-Host "📦 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = (node -v).Split('v')[1].Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "❌ ERROR: Node.js version must be 18 or higher. Current: $(node -v)" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js version: $(node -v)" -ForegroundColor Green
Write-Host ""

# Step 2: Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
Write-Host "✅ Clean complete" -ForegroundColor Green
Write-Host ""

# Step 3: Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 5: Build application
Write-Host "🏗️  Building Next.js application..." -ForegroundColor Yellow
npm run build
Write-Host "✅ Build complete" -ForegroundColor Green
Write-Host ""

# Step 6: Verify standalone output
Write-Host "🔍 Verifying standalone output..." -ForegroundColor Yellow
if (Test-Path ".next/standalone") {
    Write-Host "✅ Standalone folder exists" -ForegroundColor Green
    
    if (Test-Path ".next/standalone/server.js") {
        Write-Host "✅ Standalone server.js exists" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: .next/standalone/server.js not found!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ ERROR: .next/standalone folder not found!" -ForegroundColor Red
    Write-Host "Make sure 'output: standalone' is set in next.config.mjs" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 7: Verify server.js entry point
Write-Host "🔍 Verifying server.js entry point..." -ForegroundColor Yellow
if (Test-Path "server.js") {
    Write-Host "✅ server.js exists in root" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: server.js not found in root!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 8: Check environment variables
Write-Host "🔐 Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "✅ DATABASE_URL is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: DATABASE_URL not found in .env" -ForegroundColor Yellow
    }
    
    if ($envContent -match "JWT_SECRET") {
        Write-Host "✅ JWT_SECRET is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: JWT_SECRET not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 9: Check critical files
Write-Host "📋 Checking critical files..." -ForegroundColor Yellow
$filesOk = $true

$files = @("package.json", "next.config.mjs", ".github/workflows/deploy.yml")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: $file not found!" -ForegroundColor Red
        $filesOk = $false
    }
}

if (-not $filesOk) {
    exit 1
}
Write-Host ""

# Step 10: Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT PREPARATION COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the build output for any errors"
Write-Host "2. Test locally: npm start"
Write-Host "3. Commit and push to GitHub:"
Write-Host "   git add ."
Write-Host "   git commit -m 'Deploy to cPanel'"
Write-Host "   git push origin main"
Write-Host ""
Write-Host "📖 See CPANEL_DEPLOYMENT_GUIDE.md for full instructions" -ForegroundColor Cyan
Write-Host ""
