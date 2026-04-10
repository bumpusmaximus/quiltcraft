Write-Host "1. Balance"
try {
    $res1 = Invoke-RestMethod -Uri "http://localhost:8787/api/credits/balance" -Method GET -Headers @{ Authorization = "Bearer valid-mock-jwt" }
    $res1 | ConvertTo-Json -Compress | Write-Host
} catch {
    Write-Host $_.Exception.Message
}

Write-Host "`n2. Validate"
try {
    $res2 = Invoke-RestMethod -Uri "http://localhost:8787/api/exports/validate" -Method POST -Headers @{ Authorization = "Bearer valid-mock-jwt"; "x-idempotency-key" = "test-validate-001"; "x-craft-type" = "cross-stitch" }
    $res2 | ConvertTo-Json -Compress | Write-Host
} catch {
    Write-Host $_.Exception.Response.StatusCode
    Write-Host $_.Exception.Message
}

Write-Host "`n3. Complete"
try {
    $res3 = Invoke-RestMethod -Uri "http://localhost:8787/api/exports/complete" -Method POST -Headers @{ Authorization = "Bearer valid-mock-jwt"; "x-idempotency-key" = "test-validate-001"; "x-export-format" = "pdf"; "x-project-id" = "proj_123" }
    $res3 | ConvertTo-Json -Compress | Write-Host
} catch {
    Write-Host $_.Exception.Message
}
