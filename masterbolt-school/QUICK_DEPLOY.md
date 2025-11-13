# Quick Deployment Guide for Hostinger

## 🚀 Ready to Deploy!

Your application has been built successfully. Choose your deployment method:

---

## Option A: Static Hosting (Shared Hosting - Fastest Setup)

**Best for:** Simple hosting, no contact form functionality needed

### Steps:
1. **Upload files:**
   - Connect via FTP to your Hostinger account
   - Upload ALL files from `output-temp/public/` to `public_html/`
   - Upload `.htaccess` to the root of `public_html/`

2. **Done!** Your site should be live.

**Note:** Contact form won't work. Use Formspree or similar service.

---

## Option B: Node.js Hosting (VPS/Cloud - Full Functionality)

**Best for:** Full functionality including contact form

### Steps:
1. **Upload project to server:**
   ```bash
   # Via SSH, clone or upload your project
   cd /home/your-username
   git clone your-repo-url masterbolt-school
   cd masterbolt-school
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Set environment variables:**
   ```bash
   nano .env
   ```
   Add:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=your-email@gmail.com
   PORT=3000
   ```

4. **Start with PM2:**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx** (if needed):
   - Point your domain to `http://localhost:3000`
   - Or use Hostinger's Node.js app manager

---

## 📁 Build Output Structure

- **`output-temp/public/`** - Static files (for Option A)
- **`output-temp/server/`** - Server files (for Option B)
- **`.htaccess`** - Apache configuration (for Option A)
- **`ecosystem.config.js`** - PM2 configuration (for Option B)

---

## ✅ What's Included

- ✅ Production-optimized build
- ✅ All static assets
- ✅ Server API endpoint for contact form
- ✅ SEO-friendly configuration
- ✅ Browser caching rules
- ✅ Security headers

---

## 🔧 Troubleshooting

**Static hosting not working?**
- Check `.htaccess` is uploaded
- Verify file permissions (644/755)
- Check Hostinger error logs

**Node.js app not starting?**
- Check PM2: `pm2 status`
- View logs: `pm2 logs masterbolt-school`
- Verify Node.js version: `node -v` (needs 18+)

---

## 📧 Contact Form Setup

For the contact form to work, you need SMTP credentials in your `.env` file.

**Gmail Setup:**
1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASSWORD`

---

**Need help?** Check `DEPLOYMENT.md` for detailed instructions.

