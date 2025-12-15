# Database Setup Script for AI Email Operations Platform
# Run this script to set up your database

Write-Host "=== AI Email Operations Platform - Database Setup ===" -ForegroundColor Cyan
Write-Host ""

$PSQL_PATH = "C:\Program Files\PostgreSQL\13\bin"
$DB_NAME = "ai_operations_platform"

# Step 1: Create Database
Write-Host "Step 1: Creating database..." -ForegroundColor Yellow
& "$PSQL_PATH\createdb.exe" -U postgres $DB_NAME 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database created successfully!" -ForegroundColor Green
} else {
    Write-Host "! Database might already exist (this is okay)" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Enable Extensions
Write-Host "Step 2: Enabling extensions..." -ForegroundColor Yellow
$extensionsSQL = @"
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
"@

$extensionsSQL | & "$PSQL_PATH\psql.exe" -U postgres -d $DB_NAME 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Extensions enabled!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to enable extensions" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Run Schema
Write-Host "Step 3: Creating tables..." -ForegroundColor Yellow
$schemaPath = Join-Path $PSScriptRoot "schema.sql"

if (Test-Path $schemaPath) {
    & "$PSQL_PATH\psql.exe" -U postgres -d $DB_NAME -f $schemaPath 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Schema imported successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to import schema" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Schema file not found at: $schemaPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Verify Tables
Write-Host "Step 4: Verifying tables..." -ForegroundColor Yellow
$tableCount = & "$PSQL_PATH\psql.exe" -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1

if ($tableCount -match "\d+") {
    $count = [int]($tableCount -replace '\D','')
    Write-Host "✓ Found $count tables in database!" -ForegroundColor Green
    
    if ($count -eq 22) {
        Write-Host "✓ All 22 tables created successfully!" -ForegroundColor Green
    } else {
        Write-Host "! Expected 22 tables, found $count" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Could not verify tables" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Database Setup Complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file with database credentials"
Write-Host "2. Get your OpenAI API key"
Write-Host "3. Set up Google OAuth credentials"
Write-Host "4. Run: pnpm dev"
Write-Host ""
