@echo off
echo ============================================
echo AI Email Platform - Database Setup
echo ============================================
echo.
echo Please enter your PostgreSQL password below.
echo This password will be used for all database operations.
echo.

set /p PGPASSWORD="Enter PostgreSQL password: "
echo.

set PSQL_BIN=C:\Program Files\PostgreSQL\13\bin
set DB_NAME=ai_operations_platform

echo Step 1: Creating database...
"%PSQL_BIN%\createdb.exe" -U postgres %DB_NAME%
if errorlevel 1 (
    echo Database might already exist - continuing...
)
echo.

echo Step 2: Enabling extensions...
"%PSQL_BIN%\psql.exe" -U postgres -d %DB_NAME% -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
if errorlevel 1 (
    echo Failed to enable extensions!
    pause
    exit /b 1
)
echo.

echo Step 3: Importing schema...
"%PSQL_BIN%\psql.exe" -U postgres -d %DB_NAME% -f "%~dp0schema.sql"
if errorlevel 1 (
    echo Failed to import schema!
    pause
    exit /b 1
)
echo.

echo Step 4: Verifying tables...
"%PSQL_BIN%\psql.exe" -U postgres -d %DB_NAME% -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
echo.

echo ============================================
echo Database setup complete!
echo ============================================
echo.
echo Next steps:
echo 1. Update .env file with your database password
echo 2. Get OpenAI API key
echo 3. Run: pnpm dev
echo.
pause
