# PowerShell script to apply visualization fixes

Write-Host "🔧 Applying Visualization Fixes..." -ForegroundColor Cyan

# Read the files
$vizContent = Get-Content "js/visualization.js" -Raw
$fixedFunction = Get-Content "js/visualization-faculty-fixed.js" -Raw

# Extract just the function (remove the comment at the top)
$fixedFunction = $fixedFunction -replace '^//.*?\n\n', ''

# Find the start and end of the old function
$startPattern = '// ===== Faculty Ratings by Year ====='
$endPattern = "showAlert\('Faculty ratings report generated successfully!', 'success'\);\s*\n}"

# Find positions
$startPos = $vizContent.IndexOf($startPattern)
if ($startPos -eq -1) {
    Write-Host "❌ Could not find faculty function start" -ForegroundColor Red
    exit 1
}

# Find the end after the start
$searchFrom = $startPos
$endMatch = [regex]::Match($vizContent.Substring($searchFrom), $endPattern)
if (!$endMatch.Success) {
    Write-Host "❌ Could not find faculty function end" -ForegroundColor Red
    exit 1
}

$endPos = $searchFrom + $endMatch.Index + $endMatch.Length

Write-Host "✅ Found function at position $startPos to $endPos" -ForegroundColor Green

# Replace the function
$before = $vizContent.Substring(0, $startPos)
$after = $vizContent.Substring($endPos)
$newContent = $before + $startPattern + "`n" + $fixedFunction + $after

# Save the file
$newContent | Set-Content "js/visualization.js" -NoNewline

Write-Host "✅ Faculty function replaced successfully!" -ForegroundColor Green
Write-Host "📝 File saved: js/visualization.js" -ForegroundColor Cyan
