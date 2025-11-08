# Local Development Setup

This guide explains how to set up and run the project locally.

## Local Scripts

For local development, create a `package.local.json` file in the project root with your local database configuration:

```json
{
  "scripts": {
    "dev:local": "set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app && npm run dev",
    "prisma:migrate:local": "set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app && npx prisma migrate deploy",
    "prisma:seed:local": "set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app && npm run prisma:seed",
    "setup:local": "npm install && npm run prisma:migrate:local && npm run prisma:seed:local"
  }
}
```

**Note for Unix/Mac users**: Replace `set` with `export` and use `&&` instead:
```json
{
  "scripts": {
    "dev:local": "export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app && npm run dev",
    "prisma:migrate:local": "export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app && npx prisma migrate deploy",
    "prisma:seed:local": "export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app && npm run prisma:seed",
    "setup:local": "npm install && npm run prisma:migrate:local && npm run prisma:seed:local"
  }
}
```

## Running Local Scripts

To run a local script, use the npm-run-script syntax:

```bash
npm run --prefix-script-file=package.local.json dev:local
```

Or create a simple batch/shell script to make it easier.

## Alternative: Use .env file

Alternatively, you can set your DATABASE_URL in the `.env` file (which is gitignored) and use the standard scripts:

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app
```

Then simply run:
```bash
npm run dev
```

## First Time Setup

1. Install dependencies: `npm install`
2. Set up your `.env` file with your local database URL
3. Run migrations: `npm run prisma:migrate:deploy`
4. Seed the database: `npm run prisma:seed`
5. Start the server: `npm run dev`
