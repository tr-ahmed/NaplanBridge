# Quick Fix Script - Run in PowerShell
# Navigate to project root first

Write-Host "🔧 Fixing subscription.service.ts..." -ForegroundColor Cyan

$file = "src\app\core\services\subscription.service.ts"
$content = Get-Content $file -Raw

# Replace all this.useMock with environment.useMock
$content = $content -replace 'this\.useMock', 'environment.useMock'

# Save the file
$content | Set-Content $file -NoNewline

Write-Host "✅ Fixed all this.useMock references!" -ForegroundColor Green
Write-Host "📝 Total replacements: $(($content | Select-String -Pattern 'environment\.useMock' -AllMatches).Matches.Count)" -ForegroundColor Yellow

Write-Host "`n🎉 Done! Now run: ng serve" -ForegroundColor Green
