# Local Development Setup

This guide explains how to set up and run the project locally.

## Quick Start (Windows)

The project includes `local:*` scripts for Windows local development with a default PostgreSQL setup:

```bash
# First time setup
npm run local:setup

# Start development server
npm run local:dev
```

### Available Local Scripts

- `npm run local:dev` - Start the development server with local database
- `npm run local:migrate` - Run database migrations locally
- `npm run local:seed` - Seed the local database
- `npm run local:setup` - Complete setup (install, migrate, seed)

**Note**: These scripts use `set` command (Windows). For Unix/Mac users, see the alternative approach below.

## Alternative: Use .env file (Recommended for Unix/Mac)

For cross-platform compatibility, set your DATABASE_URL in the `.env` file (which is gitignored):

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app
```

Then use the standard scripts:
```bash
npm run dev
npm run prisma:migrate:deploy
npm run prisma:seed
```

## First Time Setup

1. Install dependencies: `npm install`
2. Choose your approach:
   - **Windows**: Use `npm run local:setup`
   - **Unix/Mac**: Create `.env` file and run migrations/seed manually
3. Start the server with `npm run local:dev` or `npm run dev` (if using .env)

## Database Configuration

The local scripts assume:
- Host: `localhost`
- Port: `5432`
- Database: `community_app`
- User: `postgres`
- Password: `postgres`

Modify the scripts in `package.json` or use `.env` file if your setup differs.
