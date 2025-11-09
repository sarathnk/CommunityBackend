# Quick Start Guide - Community Backend

This guide shows you the easiest ways to start the Community Backend application.

---

## Prerequisites

Before starting, ensure you have:
- **Node.js** v18.0.0 or higher installed
- **PostgreSQL 18** installed and running
- PostgreSQL password: `postgres` (default setup)

---

## Method 1: Windows Batch Script (Recommended for Windows)

### First Time Setup & Every Time Start

Simply double-click or run:

```batch
start.bat
```

**What it does:**
- Checks if dependencies are installed (runs `npm install` if needed)
- Verifies database exists (creates it if needed)
- Runs database migrations
- Seeds database with test data (only if empty)
- Starts the development server on port 4000

**That's it!** The script handles everything automatically.

---

## Method 2: NPM Commands (Cross-Platform)

### First Time Setup

Run this once to set up everything:

```bash
npm run setup
```

This will:
- Install all dependencies
- Run database migrations
- Seed database with test data

### Start the Server

After setup, start the server with:

```bash
npm run dev:full
```

### Individual Commands (If Needed)

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# Seed database
npm run prisma:seed

# Start development server (requires DATABASE_URL in .env)
npm run dev

# Start with automatic DATABASE_URL
npm run dev:full
```

---

## Method 3: Manual Start (Understanding Each Step)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Environment Variable (Windows)
```batch
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app
```

Or for Linux/Mac:
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app
```

### Step 3: Run Migrations
```bash
npx prisma migrate deploy
```

### Step 4: Seed Database (Optional, First Time Only)
```bash
npm run prisma:seed
```

### Step 5: Start Server
```bash
npm run dev
```

---

## Accessing the Application

Once started, the API is available at:

**Base URL:** `http://localhost:4000`

**API Endpoints:** `http://localhost:4000/api/`

Example:
- Login: `POST http://localhost:4000/api/auth/login`
- Organizations: `GET http://localhost:4000/api/organizations`

---

## Test Accounts

Use these credentials to test the application:

### Super Admin
- **Phone:** `+918547581833`
- **Password:** `superadmin123`
- Full system access

### Tech Community Hub
- **Admin:** `+917012999572` / `admin123`
- **Moderator:** `+919562929216` / `mod123`
- **Member:** `+919562929217` / `member123`

### Green Earth Foundation
- **Admin:** `+11234567900` / `admin123`
- **Moderator:** `+11234567901` / `mod123`
- **Member:** `+11234567902` / `member123`

### Creative Arts Club
- **Admin:** `+11234567910` / `admin123`
- **Moderator:** `+11234567911` / `mod123`
- **Member:** `+11234567912` / `member123`

---

## Troubleshooting

### Database Connection Issues

**Error:** "Database connection refused"

**Solution:**
1. Ensure PostgreSQL is running
2. Check PostgreSQL service: `services.msc` (Windows)
3. Verify credentials in `.env` file

### Port Already in Use

**Error:** "Port 4000 already in use"

**Solution:**
1. Stop any running instance of the server (Ctrl+C)
2. Kill the process using port 4000:
   ```bash
   # Windows
   netstat -ano | findstr :4000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -ti:4000 | xargs kill -9
   ```

### Database Doesn't Exist

**Error:** "Database 'community_app' does not exist"

**Solution:**
```bash
# Run this with PostgreSQL password
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE community_app;"
```

Or just run `start.bat` which creates it automatically.

### Migrations Fail

**Error:** "Migration failed"

**Solution:**
```bash
# Reset and recreate migrations
npx prisma migrate reset
npm run prisma:migrate:deploy
npm run prisma:seed
```

---

## Environment Configuration

The application requires these environment variables (already set in `.env`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/community_app"
JWT_SECRET="your-super-secret-jwt-key-here-12345"
PORT=4000
NODE_ENV=development
```

To use different PostgreSQL credentials, update the `DATABASE_URL` format:

```
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME"
```

---

## Development Features

- **Hot Reload:** Enabled via `node --watch` - code changes auto-restart the server
- **Auto Seed:** Database is seeded with test data automatically on first run
- **CORS:** Enabled for local development
- **Request Logging:** Morgan logger shows all API requests

---

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

---

## Next Steps

1. **Test the API:** Use Postman, Thunder Client, or curl
2. **Read the API docs:** Check available endpoints in `src/routes/`
3. **Explore the code:** Start with `index.js` to understand the setup
4. **Connect frontend:** Use the base URL `http://localhost:4000` in your frontend app

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start everything (Windows) | `start.bat` |
| Start server | `npm run dev:full` |
| First-time setup | `npm run setup` |
| Seed database | `npm run prisma:seed` |
| Run migrations | `npm run prisma:migrate:deploy` |
| View database | Use pgAdmin or Prisma Studio |

---

## Support

For issues or questions:
- Check the main [README.md](README.md)
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Check Prisma docs: https://www.prisma.io/docs

---

**Happy Coding! 🚀**
