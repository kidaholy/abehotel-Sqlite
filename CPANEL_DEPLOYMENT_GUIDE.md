# 🚀 cPanel Deployment Guide for AbeHotel

## ✅ Phase 1: Next.js App Preparation (COMPLETE)

Your app is already configured for cPanel standalone deployment!

### Current Configuration:

1. **Standalone Output** - ✅ Already configured in [next.config.mjs](next.config.mjs#L19)
   ```javascript
   output: "standalone"
   ```

2. **Server Entry Point** - ✅ Already exists at [server.js](server.js)
   - Optimized for cPanel/Phusion Passenger
   - Includes error logging to `startup-error.log`
   - Automatically loads `.next/standalone/server.js`
   - Sets Prisma to binary mode for shared hosting

3. **Build Command** - ✅ Ready
   ```bash
   npm run build
   ```
   This will create the `.next/standalone` folder that cPanel needs.

---

## 🗄️ Phase 2: Database Setup (PostgreSQL)

### Option A: Using Yegara's PostgreSQL (Recommended for Production)

1. **Create Database in cPanel:**
   - Go to cPanel → **PostgreSQL Databases**
   - Create a new database: `abehotel`
   - Create a database user with a strong password
   - Assign the user to the database with **ALL PRIVILEGES**

2. **Update Environment Variables:**
   
   In cPanel **Setup Node.js App** → Environment Variables, add:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   ```

   Or update your local `.env` file before pushing:
   ```env
   DATABASE_URL="postgresql://your_user:your_password@localhost:5432/abehotel"
   ```

3. **Run Prisma Migrations:**
   After deployment, in cPanel Terminal or via SSH:
   ```bash
   cd /home/username/abehotel
   npx prisma generate
   npx prisma db push
   ```

### Option B: Continue Using SQLite (Simpler)

If you want to keep using SQLite (your current setup):

1. Ensure the `data/` folder has write permissions:
   ```bash
   chmod 755 /home/username/abehotel/data
   chmod 664 /home/username/abehotel/data/abehotel.sqlite
   ```

2. Your current `.env` already has:
   ```env
   SQLITE_PATH="data/abehotel.sqlite"
   ```

---

## 🔄 Phase 3: Automated Deployment via GitHub Actions

### Current Setup: ✅ Already Configured

You have [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) set up to trigger cPanel deployment on every push to `main` branch.

### Required GitHub Secrets:

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `YEGARA_USER` | Your cPanel username | Found in cPanel top-right |
| `CPANEL_TOKEN` | Your cPanel API token | Generate in cPanel → Security → Manage API Tokens |
| `YEGARA_HOST` | Your server hostname | e.g., `yegaraplatform.com` or your server IP |

### How to Generate cPanel API Token:

1. Log in to cPanel
2. Go to **Security** → **Manage API Tokens**
3. Click **Create Token**
4. Give it a name (e.g., `github-deploy`)
5. Copy the token and save it as `CPANEL_TOKEN` in GitHub secrets

### Alternative: Manual cPanel Git Pull

If you prefer manual control:

1. In cPanel, go to **Git Version Control**
2. Select your repository
3. Click **Pull or Deploy**
4. This will pull the latest changes from GitHub

---

## ⚙️ Phase 4: Finalize in cPanel

### Step-by-Step Setup:

1. **Upload Files to cPanel:**
   
   Via Git (Recommended):
   - cPanel → **Git Version Control** → Create repository from GitHub
   
   OR via FTP/File Manager:
   - Upload all files EXCEPT `node_modules`
   - Include: `.env`, `package.json`, `server.js`, `next.config.mjs`, all app files

2. **Setup Node.js App:**
   
   Go to cPanel → **Setup Node.js App** → **Create Application**

   | Setting | Value |
   |---------|-------|
   | Node.js version | 18.x or 20.x (LTS) |
   | Application mode | Production |
   | Application root | `abehotel` (or your folder path) |
   | Application URL | `abehotel.com` (your domain) |
   | Application startup file | `server.js` |

3. **Set Environment Variables:**
   
   In the Node.js App setup page, add:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://user:pass@localhost:5432/abehotel
   JWT_SECRET=your-production-secret-key
   ```

4. **Install Dependencies:**
   
   Click **Run npm install** button in the Node.js App page.
   
   Or via Terminal:
   ```bash
   cd /home/username/abehotel
   npm install --production
   ```

5. **Build the App:**
   
   Via cPanel Terminal:
   ```bash
   cd /home/username/abehotel
   npm run build
   ```
   
   This creates the `.next/standalone` folder.

6. **Set Permissions:**
   ```bash
   chmod -R 755 /home/username/abehotel/.next
   chmod -R 755 /home/username/abehotel/public
   chmod 755 /home/username/abehotel/data
   ```

7. **Restart Application:**
   
   Click **Restart** button in Node.js App setup page.

---

## 🔍 Troubleshooting

### App Won't Start?

1. **Check Error Logs:**
   ```bash
   cat /home/username/abehotel/startup-error.log
   ```

2. **Check Passenger Logs:**
   ```bash
   tail -f /home/username/logs/abehotel/error.log
   ```

3. **Verify Standalone Build:**
   ```bash
   ls -la /home/username/abehotel/.next/standalone/
   # Should contain: server.js, package.json, node_modules/
   ```

### Database Connection Issues?

1. **Test Connection:**
   ```bash
   psql -h localhost -U your_user -d abehotel
   ```

2. **Verify .env:**
   ```bash
   cat /home/username/abehotel/.env | grep DATABASE_URL
   ```

### Build Fails?

1. **Check Node Version:**
   ```bash
   node -v
   # Should be 18.x or higher
   ```

2. **Clear Cache & Rebuild:**
   ```bash
   rm -rf .next
   npm run build
   ```

---

## 📋 Quick Deployment Checklist

- [ ] `output: "standalone"` in next.config.mjs ✅
- [ ] `server.js` exists in root ✅
- [ ] GitHub secrets configured (YEGARA_USER, CPANEL_TOKEN, YEGARA_HOST)
- [ ] Database created in cPanel (PostgreSQL or SQLite)
- [ ] `.env` file has correct DATABASE_URL
- [ ] Node.js App created in cPanel
- [ ] Startup file set to `server.js`
- [ ] Environment variables added in cPanel
- [ ] `npm install` completed
- [ ] `npm run build` completed
- [ ] Application restarted
- [ ] Site accessible at your domain

---

## 🎯 Next Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for cPanel deployment"
   git push origin main
   ```

2. **Verify Deployment:**
   - Check GitHub Actions tab for build status
   - Visit your domain to confirm app is running
   - Test database connectivity

3. **Monitor Logs:**
   - Set up log rotation in cPanel
   - Monitor `startup-error.log` for issues
   - Check Passenger logs periodically

---

## 📞 Support

If you encounter issues:
- Check cPanel error logs
- Review GitHub Actions logs
- Verify all environment variables are set
- Ensure Node.js version is 18+

**Your app is ready for deployment!** 🎉
