# Test Auth Service via Gateway

# Test 1: Health Check
Write-Host ""
Write-Host "=== Test 1: Health Check ===" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:8080/auth/health" -Method Get
Write-Host "Status: $($response.status)" -ForegroundColor Green
Write-Host "Service: $($response.service)"

# Test 2: Register User
Write-Host ""
Write-Host "=== Test 2: Register User ===" -ForegroundColor Cyan
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$registerData = @{
    username = "testuser_$timestamp"
    email = "test_$timestamp@example.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/auth/register" -Method Post -Body $registerData -ContentType "application/json"
    Write-Host "User registered: $($response.user.username)" -ForegroundColor Green
    Write-Host "  Email: $($response.user.email)"
    Write-Host "  ID: $($response.user.id)"
    $username = $response.user.username
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Login
Write-Host ""
Write-Host "=== Test 3: Login ===" -ForegroundColor Cyan
$loginData = @{
    username = $username
    password = "Test123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host "  User: $($response.user.username)"
    Write-Host "  Access Token: $($response.accessToken.Substring(0, 50))..."
    Write-Host "  Session Token: $($response.sessionToken.Substring(0, 50))..."
    Write-Host "  Expires At: $($response.expiresAt)"
    $accessToken = $response.accessToken
    $sessionToken = $response.sessionToken
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get Current User
Write-Host ""
Write-Host "=== Test 4: Get Current User ===" -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "X-Session-Token" = $sessionToken
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/auth/me" -Method Get -Headers $headers
    Write-Host "Got current user" -ForegroundColor Green
    Write-Host "  Username: $($response.user.username)"
    Write-Host "  Email: $($response.user.email)"
    Write-Host "  Created: $($response.user.createdAt)"
} catch {
    Write-Host "Get current user failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: Validate Token
Write-Host ""
Write-Host "=== Test 5: Validate Token ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/auth/validate" -Method Get -Headers $headers
    Write-Host "Token validation successful" -ForegroundColor Green
    Write-Host "  Valid: $($response.valid)"
    Write-Host "  User: $($response.user.username)"
} catch {
    Write-Host "Token validation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 6: Logout
Write-Host ""
Write-Host "=== Test 6: Logout ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/auth/logout" -Method Post -Headers $headers
    Write-Host "Logout successful" -ForegroundColor Green
    Write-Host "  Message: $($response.message)"
} catch {
    Write-Host "Logout failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 7: Try to access after logout (should fail)
Write-Host ""
Write-Host "=== Test 7: Access After Logout (should fail) ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/auth/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "Should have failed!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "Access correctly rejected after logout" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== ALL TESTS PASSED ===" -ForegroundColor Green
