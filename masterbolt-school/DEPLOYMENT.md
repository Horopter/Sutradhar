# Deployment Guide for Hostinger

This guide covers deploying the Masterbolt website to Hostinger.

## Option 1: Static Site Hosting (Easiest - Shared Hosting)

**Note:** The contact form will NOT work with static hosting. You'll need to use a third-party form service like Formspree, Netlify Forms, or similar.

### Steps:

1. **Build the static site:**
   ```bash
   npm run generate
   ```
   This creates a `output-temp/public` directory with all static files.

2. **Upload to Hostinger:**
   - Connect via FTP/SFTP to your Hostinger account
   - Upload all contents of `output-temp/public` to your `public_html` directory
   - Upload the `.htaccess` file to the root of `public_html`

3. **Configure domain:**
   - Point your domain to the `public_html` directory in Hostinger's file manager

### Contact Form Alternative for Static Hosting:

Replace the contact form API with a service like:
- **Formspree**: https://formspree.io
- **Netlify Forms**: If using Netlify
- **EmailJS**: Client-side email sending

---

## Option 2: Node.js Hosting (VPS/Cloud - Recommended)

This option allows the contact form to work properly.

### Prerequisites:
- Hostinger VPS or Cloud hosting with Node.js support
- SSH access to your server
- PM2 installed (for process management)

### Steps:

1. **Build the application:**
   ```bash
   npm run build
   ```
   This creates a `output-temp` directory with the server files.

2. **Upload files to server:**
   - Upload the entire project folder to your server
   - Or use Git to clone the repository on the server

3. **Install dependencies on server:**
   ```bash
   npm install --production
   ```

4. **Set up environment variables:**
   Create a `.env` file in the project root:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=your-email@gmail.com
   NODE_ENV=production
   PORT=3000
   ```

5. **Install PM2 (if not already installed):**
   ```bash
   npm install -g pm2
   ```

6. **Start the application with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx (if using VPS):**
   Create an Nginx configuration file:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Set up SSL (Recommended):**
   - Use Let's Encrypt with Certbot
   - Or use Hostinger's SSL certificate feature

### Managing the Application:

- **View logs:** `pm2 logs masterbolt-school`
- **Restart:** `pm2 restart masterbolt-school`
- **Stop:** `pm2 stop masterbolt-school`
- **Status:** `pm2 status`

---

## Option 3: Hybrid Approach (Static + External API)

1. Deploy the static site to Hostinger shared hosting
2. Deploy the API separately to a service like:
   - **Vercel** (free tier available)
   - **Netlify Functions**
   - **Railway**
   - **Render**
3. Update the contact form to point to the external API URL

---

## Environment Variables

For the contact form to work, you need these environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

**For Gmail:**
- Enable 2-factor authentication
- Generate an "App Password" in your Google Account settings
- Use the app password as `SMTP_PASSWORD`

---

## Troubleshooting

### Static Hosting Issues:
- Ensure `.htaccess` is uploaded and enabled
- Check file permissions (should be 644 for files, 755 for directories)
- Verify all files are in `public_html`

### Node.js Hosting Issues:
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs masterbolt-school`
- Verify Node.js version: `node -v` (should be 18+)
- Check port availability: `netstat -tulpn | grep 3000`

---

## Recommended: Option 2 (Node.js Hosting)

For the best experience with full functionality, use Option 2 with Hostinger VPS or Cloud hosting.

