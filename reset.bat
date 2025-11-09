@echo off
echo ========================================
echo  Community Backend - Database Reset
echo ========================================
echo.
echo WARNING: This will delete all data!
echo Press Ctrl+C to cancel, or
pause

REM Set the DATABASE_URL environment variable
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_app

REM Drop and recreate the database
echo [INFO] Dropping and recreating database...
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS community_app;"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE community_app;"

REM Run migrations
echo [INFO] Running database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
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
echo  Database Reset Complete!
echo ========================================
echo.
echo Test Accounts:
echo   Super Admin: +918547581833 / superadmin123
echo   Tech Hub Admin: +917012999572 / admin123
echo.
pause
