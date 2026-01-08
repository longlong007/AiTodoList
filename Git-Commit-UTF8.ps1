# Git Commit with proper UTF-8 encoding
# Interactive commit helper for Chinese messages
# Usage: .\Git-Commit-UTF8.ps1 [-Message "your message"]

param(
    [string]$Message
)

$ErrorActionPreference = "Stop"

# Set UTF-8 encoding for this session
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Git UTF-8 Commit Helper" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# If no message provided, ask user to input
if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host "Enter your commit message (supports Chinese):" -ForegroundColor Yellow
    Write-Host "Example: fix: some bug description" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Message: " -NoNewline -ForegroundColor White
    $Message = Read-Host
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host ""
    Write-Host "Error: Commit message cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[Step 1] Preparing commit message..." -ForegroundColor Green
Write-Host "  Message: $Message" -ForegroundColor White

# Write message to temporary file in UTF-8
$msgFile = Join-Path $env:TEMP "git-commit-msg-utf8.txt"
$Message | Out-File -FilePath $msgFile -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "[Step 2] Committing..." -ForegroundColor Green
try {
    git -c i18n.commitEncoding=utf-8 commit -F $msgFile
    
    Write-Host ""
    Write-Host "[Step 3] Verifying commit..." -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    git log -1 --oneline
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "SUCCESS! Commit created with UTF-8 encoding." -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Commit failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    Remove-Item $msgFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Tips for permanent fix:" -ForegroundColor Yellow
Write-Host "  1. Add to PowerShell profile (`$PROFILE):" -ForegroundColor White
Write-Host "     `$OutputEncoding = [System.Text.Encoding]::UTF8" -ForegroundColor Cyan
Write-Host "     [Console]::OutputEncoding = [System.Text.Encoding]::UTF8" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Always use this script for Chinese commits" -ForegroundColor White
Write-Host "     .\Git-Commit-UTF8.ps1" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
