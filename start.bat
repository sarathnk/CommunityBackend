@echo off
echo ========================================
echo  Community Backend - Starting Server
echo ========================================
echo.

REM Set the DATABASE_URL environment variable
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Reset database first
echo [INFO] Resetting database...
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS community_app;" >nul 2>&1
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE community_app;" >nul 2>&1

REM Delete migration lock files
if exist "prisma\migrations\migration_lock.toml" del "prisma\migrations\migration_lock.toml" >nul 2>&1

REM Run migrations
echo [INFO] Running database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo [ERROR] Failed to run migrations
    echo [INFO] Trying to reset Prisma migrations...
    call npx prisma migrate resolve --rolled-back 20251105162205_add_income_description_and_expense_table
    call npx prisma migrate deploy
    if errorlevel 1 (
        echo [ERROR] Failed to run migrations after retry
        pause
        exit /b 1
    )
)

REM Seed the database
echo [INFO] Seeding database with test data...
call npm run prisma:seed
if errorlevel 1 (
    echo [ERROR] Failed to seed database
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Server Starting on http://localhost:4000
echo ========================================
echo.
echo Test Accounts:
echo   Super Admin: +918547581833 / superadmin123
echo   Tech Hub Admin: +917012999572 / admin123
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the development server
call npm run dev
