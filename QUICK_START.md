# ⚡ Quick Start - Apex Academy

## Fastest Way to Launch

### Option 1: Automated Script (Recommended)
```bash
./apps/launch-apex-academy.sh
```

This opens 3 terminal windows and starts all services automatically.

### Option 2: Manual (3 Terminal Windows)

**Terminal 1:**
```bash
cd apps/convex
npx convex dev
```

**Terminal 2:**
```bash
cd apps/worker
npm run dev
```

**Terminal 3:**
```bash
cd apps/nuxt
pnpm install  # First time only
pnpm dev
```

## 🎯 Then Visit

**http://localhost:3000**

Click "Continue as Guest" and start learning!

## ✅ What to Expect

1. **Convex** - Database backend (port 3210)
2. **Worker** - API server (port 4001)
3. **Nuxt** - Frontend (port 3000) - First build takes 1-2 minutes

## 🆘 Quick Troubleshooting

**Port already in use?**
- Kill existing processes: `lsof -ti:3000,4001,3210 | xargs kill -9`

**Dependencies not installed?**
- `cd apps/nuxt && pnpm install`
- `cd apps/worker && npm install`
- `cd apps/convex && npm install`

**Services won't start?**
- Check Node.js version: `node --version` (need 18+)
- Verify ports are free
- Check for error messages in terminals

