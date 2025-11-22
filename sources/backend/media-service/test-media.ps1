# Test Media Service

Write-Host "🧪 Testing Media Service..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080/media"

# 1. Health Check
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
    Write-Host "   Uploads Directory: $($health.uploadsDirectory)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# 2. Create test file
Write-Host "2️⃣ Creating test file..." -ForegroundColor Yellow
$testFile = "test-image.txt"
"This is a test file for Media Service" | Out-File -FilePath $testFile -Encoding UTF8
Write-Host "✅ Test file created: $testFile" -ForegroundColor Green
Write-Host ""

# 3. Upload Single File
Write-Host "3️⃣ Testing Single File Upload..." -ForegroundColor Yellow
try {
    $form = @{
        file = Get-Item -Path $testFile
    }
    $upload = Invoke-RestMethod -Uri "$baseUrl/upload/single" -Method Post -Form $form
    Write-Host "✅ File uploaded successfully!" -ForegroundColor Green
    Write-Host "   Filename: $($upload.file.filename)" -ForegroundColor Gray
    Write-Host "   Size: $($upload.file.size) bytes" -ForegroundColor Gray
    Write-Host "   URL: $($upload.file.url)" -ForegroundColor Gray
    $uploadedFilename = $upload.file.filename
} catch {
    Write-Host "❌ Upload failed: $_" -ForegroundColor Red
}
Write-Host ""

# 4. List Files
Write-Host "4️⃣ Testing List Files..." -ForegroundColor Yellow
try {
    $files = Invoke-RestMethod -Uri "$baseUrl/files" -Method Get
    Write-Host "✅ Files listed: $($files.count) file(s)" -ForegroundColor Green
    foreach ($file in $files.files) {
        Write-Host "   - $($file.filename) ($($file.size) bytes)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ List files failed: $_" -ForegroundColor Red
}
Write-Host ""

# 5. Get File Info
if ($uploadedFilename) {
    Write-Host "5️⃣ Testing Get File Info..." -ForegroundColor Yellow
    try {
        $info = Invoke-RestMethod -Uri "$baseUrl/info/$uploadedFilename" -Method Get
        Write-Host "✅ File info retrieved!" -ForegroundColor Green
        Write-Host "   Extension: $($info.extension)" -ForegroundColor Gray
        Write-Host "   Size: $($info.size) bytes" -ForegroundColor Gray
        Write-Host "   Created: $($info.createdAt)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Get info failed: $_" -ForegroundColor Red
    }
    Write-Host ""

    # 6. Download File
    Write-Host "6️⃣ Testing Download File..." -ForegroundColor Yellow
    try {
        $downloadPath = "downloaded-$testFile"
        Invoke-WebRequest -Uri "$baseUrl/files/$uploadedFilename" -OutFile $downloadPath
        Write-Host "✅ File downloaded to: $downloadPath" -ForegroundColor Green
        $downloadedContent = Get-Content $downloadPath
        Write-Host "   Content: $downloadedContent" -ForegroundColor Gray
        Remove-Item $downloadPath
    } catch {
        Write-Host "❌ Download failed: $_" -ForegroundColor Red
    }
    Write-Host ""

    # 7. Delete File
    Write-Host "7️⃣ Testing Delete File..." -ForegroundColor Yellow
    try {
        $delete = Invoke-RestMethod -Uri "$baseUrl/files/$uploadedFilename" -Method Delete
        Write-Host "✅ File deleted: $($delete.filename)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Delete failed: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# 8. Test Multiple Upload
Write-Host "8️⃣ Testing Multiple Files Upload..." -ForegroundColor Yellow
$testFile2 = "test-image2.txt"
"Second test file" | Out-File -FilePath $testFile2 -Encoding UTF8

try {
    # PowerShell doesn't support multipart/form-data with multiple files easily
    # This is a simplified test
    Write-Host "⚠️  Multiple file upload test requires curl or Postman" -ForegroundColor Yellow
    Write-Host "   Example curl command:" -ForegroundColor Gray
    Write-Host "   curl -X POST http://localhost:8080/media/upload -F 'files=@$testFile' -F 'files=@$testFile2'" -ForegroundColor Gray
} catch {
    Write-Host "❌ Multiple upload test skipped" -ForegroundColor Red
}
Write-Host ""

# Cleanup
Write-Host "🧹 Cleaning up test files..." -ForegroundColor Cyan
Remove-Item $testFile -ErrorAction SilentlyContinue
Remove-Item $testFile2 -ErrorAction SilentlyContinue
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

Write-Host "✨ Media Service tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host '📚 Available endpoints:' -ForegroundColor Cyan
Write-Host '   - POST   http://localhost:8080/media/upload           (multiple files)' -ForegroundColor White
Write-Host '   - POST   http://localhost:8080/media/upload/single    (single file)' -ForegroundColor White
Write-Host '   - GET    http://localhost:8080/media/files            (list all)' -ForegroundColor White
Write-Host '   - GET    http://localhost:8080/media/files/:filename  (download)' -ForegroundColor White
Write-Host '   - GET    http://localhost:8080/media/info/:filename   (file info)' -ForegroundColor White
Write-Host '   - DELETE http://localhost:8080/media/files/:filename  (delete)' -ForegroundColor White
Write-Host '   - GET    http://localhost:8080/media/health           (health check)' -ForegroundColor White
