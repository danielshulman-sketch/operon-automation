#!/usr/bin/env pwsh
# OAuth Credentials Setup Script
# Run this after creating OAuth apps for all integrations

Write-Host "🔐 OAuth Credentials Setup for Operon Platform" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "This script will help you add OAuth credentials to Vercel." -ForegroundColor Yellow
Write-Host "Make sure you have created OAuth apps for:" -ForegroundColor Yellow
Write-Host "  ✓ Slack (https://api.slack.com/apps)" -ForegroundColor Gray
Write-Host "  ✓ Google Sheets (https://console.cloud.google.com)" -ForegroundColor Gray
Write-Host "  ✓ Notion (https://www.notion.so/my-integrations)" -ForegroundColor Gray
Write-Host "  ✓ Airtable (https://airtable.com/create/oauth)" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you created all OAuth apps? (y/n)"
if ($continue -ne 'y') {
    Write-Host "`n❌ Please create the OAuth apps first using the walkthrough guide." -ForegroundColor Red
    exit
}

Write-Host "`n📝 Adding credentials to Vercel...`n" -ForegroundColor Green

# Slack
Write-Host "=== SLACK ===" -ForegroundColor Magenta
vercel env add SLACK_CLIENT_ID production
vercel env add SLACK_CLIENT_SECRET production

# Google Sheets
Write-Host "`n=== GOOGLE SHEETS ===" -ForegroundColor Magenta
vercel env add GOOGLE_SHEETS_CLIENT_ID production
vercel env add GOOGLE_SHEETS_CLIENT_SECRET production

# Notion
Write-Host "`n=== NOTION ===" -ForegroundColor Magenta
vercel env add NOTION_CLIENT_ID production
vercel env add NOTION_CLIENT_SECRET production

# Airtable
Write-Host "`n=== AIRTABLE ===" -ForegroundColor Magenta
vercel env add AIRTABLE_CLIENT_ID production
vercel env add AIRTABLE_CLIENT_SECRET production

Write-Host "`n✅ All credentials added!" -ForegroundColor Green
Write-Host "`n🚀 Deploying to production..." -ForegroundColor Cyan

vercel --prod

Write-Host "`n✨ Done! Your integrations are now configured." -ForegroundColor Green
Write-Host "📱 Test them at: https://frontend-eight-sigma-62.vercel.app" -ForegroundColor Cyan
