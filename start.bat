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

REM Check if database exists and is accessible
echo [INFO] Checking database connection...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d community_app -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [WARN] Database 'community_app' not accessible or doesn't exist
    echo [INFO] Creating database...
    set PGPASSWORD=postgres
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE community_app;" 2>nul
    if errorlevel 1 (
        echo [INFO] Database might already exist, continuing...
    )
)

REM Run migrations
echo [INFO] Running database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
)

REM Check if database has data
echo [INFO] Checking if database needs seeding...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d community_app -t -c "SELECT COUNT(*) FROM \"User\";" 2>nul | findstr /r "^[1-9]" >nul
if errorlevel 1 (
    echo [INFO] Database is empty, seeding with test data...
    call npm run prisma:seed
    if errorlevel 1 (
        echo [ERROR] Failed to seed database
        pause
        exit /b 1
    )
) else (
    echo [INFO] Database already has data, skipping seed
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
