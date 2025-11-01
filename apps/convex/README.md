# Convex Backend

This directory contains the Convex backend for Sutradhar.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the Convex dev server:
   ```bash
   pnpm dev
   ```

3. The dev server will run on `http://127.0.0.1:3210` by default.

4. Set `CONVEX_URL=http://127.0.0.1:3210` in `apps/worker/.env` to connect the worker to this backend.

## Note

The worker requires `CONVEX_URL` to be set in its environment to enable Convex operations. Without it, all Convex calls will be skipped.
