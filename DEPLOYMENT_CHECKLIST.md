# 📋 cPanel Deployment Quick Checklist

## ✅ Pre-Deployment (Do This on Your Computer)

### 1. Verify Configuration Files
- [ ] `next.config.mjs` has `output: "standalone"` ✅ **DONE**
- [ ] `server.js` exists in root directory ✅ **DONE**
- [ ] `.github/workflows/deploy.yml` exists ✅ **DONE**
- [ ] `.env` file has all required variables

### 2. Required Environment Variables
Make sure your `.env` has these (update for production):
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/abehotel"
JWT_SECRET="your-production-secret-change-this"
PORT=3000
NODE_ENV=production
```

### 3. Build & Test Locally
Run these commands in PowerShell:
```powershell
# Clean and rebuild
.\prepare-deploy.ps1

# Or manually:
npm install
npx prisma generate
npm run build

# Test the standalone build
cd .next/standalone
node server.js
```

### 4. Commit & Push
```bash
git add .
git commit -m "Prepare for cPanel deployment"
git push origin main
```

---

## 🌐 cPanel Setup (Do This in cPanel)

### 1. Create Database
- [ ] Go to **PostgreSQL Databases** in cPanel
- [ ] Create database: `abehotel`
- [ ] Create database user with password
- [ ] Assign user to database with ALL PRIVILEGES
- [ ] Note the connection details

### 2. Setup Git Repository (Option A - Automated)
- [ ] Go to **Git Version Control** in cPanel
- [ ] Click **Create** → **Clone a Repository**
- [ ] Enter your GitHub repo URL
- [ ] Set repository root: `repositories/hotel-app`
- [ ] Click **Create**

### 3. Upload Files (Option B - Manual)
If not using Git, upload via File Manager:
- [ ] All project files (except `node_modules`)
- [ ] Include: `.env`, `package.json`, `server.js`, `next.config.mjs`
- [ ] Include: `app/`, `components/`, `lib/`, `public/`, etc.

### 4. Create Node.js Application
- [ ] Go to **Setup Node.js App** in cPanel
- [ ] Click **Create Application**
- [ ] Fill in:
  - **Node.js version**: 18.x or 20.x (LTS)
  - **Application mode**: Production
  - **Application root**: `abehotel` (or your path)
  - **Application URL**: `abehotel.com`
  - **Application startup file**: `server.js`

### 5. Set Environment Variables
In the Node.js App page, add these variables:
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=postgresql://user:pass@localhost:5432/abehotel`
- [ ] `JWT_SECRET=your-production-secret`
- [ ] `PORT=3000`

### 6. Install Dependencies
- [ ] Click **Run npm install** button in Node.js App page

**OR** via Terminal:
```bash
cd /home/username/abehotel
npm install --production
```

### 7. Generate Prisma Client
Via cPanel Terminal:
```bash
cd /home/username/abehotel
npx prisma generate
```

### 8. Build Application
Via cPanel Terminal:
```bash
cd /home/username/abehotel
npm run build
```

### 9. Set File Permissions
Via cPanel Terminal:
```bash
chmod -R 755 /home/username/abehotel/.next
chmod -R 755 /home/username/abehotel/public
chmod 755 /home/username/abehotel/data
chmod 664 /home/username/abehotel/data/abehotel.sqlite
```

### 10. Start Application
- [ ] Click **Restart** button in Node.js App page
- [ ] Wait 30 seconds
- [ ] Visit your domain to test

---

## 🔧 GitHub Actions Setup (For Automated Deployment)

### 1. Generate cPanel API Token
- [ ] Log in to cPanel
- [ ] Go to **Security** → **Manage API Tokens**
- [ ] Click **Create Token**
- [ ] Name it: `github-deploy`
- [ ] Copy the token (save it securely!)

### 2. Add GitHub Secrets
Go to GitHub → Your Repo → **Settings** → **Secrets and variables** → **Actions**:

- [ ] Create secret: `YEGARA_USER` = Your cPanel username
- [ ] Create secret: `CPANEL_TOKEN` = The API token you just created
- [ ] Create secret: `YEGARA_HOST` = Your server hostname (e.g., `yegaraplatform.com`)

### 3. Test Automated Deployment
```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test automated deployment"
git push origin main
```

- [ ] Go to GitHub → **Actions** tab
- [ ] Watch the deployment workflow
- [ ] Verify it completes successfully

---

## ✅ Post-Deployment Verification

### 1. Check if App is Running
- [ ] Visit your domain: `http://abehotel.com`
- [ ] Check if homepage loads
- [ ] Try logging in

### 2. Verify Database Connection
- [ ] Try creating a test record
- [ ] Check if data is saved
- [ ] Verify data appears after refresh

### 3. Check Error Logs
Via cPanel Terminal:
```bash
# Check startup logs
cat /home/username/abehotel/startup-error.log

# Check Passenger logs
tail -f /home/username/logs/abehotel/error.log
```

### 4. Test Key Features
- [ ] Login/Authentication
- [ ] Menu browsing
- [ ] Order creation
- [ ] Admin dashboard
- [ ] Image uploads

---

## 🚨 Troubleshooting

### App Won't Start?
1. Check `startup-error.log`
2. Verify Node.js version (must be 18+)
3. Ensure `.next/standalone` exists
4. Check environment variables are set

### Database Connection Failed?
1. Verify `DATABASE_URL` in cPanel environment variables
2. Test connection: `psql -h localhost -U user -d abehotel`
3. Check database user has correct permissions

### 500 Internal Server Error?
1. Check Passenger error logs
2. Verify all dependencies installed
3. Rebuild: `npm run build`
4. Restart app in cPanel

### GitHub Actions Failing?
1. Check Actions tab for error details
2. Verify all secrets are set correctly
3. Test API token manually:
   ```bash
   curl -H "Authorization: cpanel USER:TOKEN" \
        "https://HOST:2083/execute/VersionControl/list"
   ```

---

## 📞 Quick Reference Commands

### Local Development
```powershell
npm run dev              # Start dev server
.\prepare-deploy.ps1     # Prepare for deployment
npm run build            # Build for production
```

### cPanel Terminal
```bash
cd /home/username/abehotel
npm install              # Install dependencies
npm run build            # Build app
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push database schema
```

### Git Commands
```bash
git status               # Check changes
git add .                # Stage all changes
git commit -m "message"  # Commit
git push origin main     # Push to GitHub
```

---

## 🎯 Deployment Timeline

**Estimated Time: 30-45 minutes**

1. **Preparation** (10 min): Build, test, commit
2. **cPanel Setup** (15 min): Database, Node.js app, env vars
3. **Deployment** (5 min): Install, build, restart
4. **Testing** (10 min): Verify everything works
5. **GitHub Actions** (5 min): Setup automated deployment

---

## 📚 Additional Resources

- [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) - Full detailed guide
- [prepare-deploy.ps1](prepare-deploy.ps1) - Automated preparation script
- [prepare-deploy.sh](prepare-deploy.sh) - Linux/Mac preparation script

---

**Last Updated:** April 26, 2026
**Status:** Ready for Deployment ✅
