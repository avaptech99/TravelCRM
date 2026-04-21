# --- CONFIGURATION ---
# Replace with your actual credentials if they are not in your environment
$user = "gdms_user" 
$pass = "SuperSecret123!"
$url = "https://travelcrm-testing.onrender.com/api/webhook/missed-call"
# ---------------------

$headers = @{
    "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
    "Content-Type"  = "application/json"
}

$uniqueId = "TEST_CALL_" + (Get-Date -Format "yyyyMMdd_HHmmss")

# SCENARIO 1: INBOUND MISSED (Leg 1)
$body1 = @{
    cdr_root = @(
        @{
            src = "16042179835"
            caller_name = "Real Customer"
            dst = "6400"
            start = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            disposition = "NO ANSWER"
            billsec = "0"
            duration = "0"
            uniqueid = $uniqueId
            userfield = "Inbound"
        }
    )
} | ConvertTo-Json

Write-Host "Sending Scenario 1: Inbound Missed (Red Icon)..." -ForegroundColor Cyan
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body1

# Wait 2 seconds
Start-Sleep -Seconds 2

# SCENARIO 2: INBOUND ANSWERED (Leg 2 - Update existing lead)
$body2 = @{
    cdr_root = @(
        @{
            src = "16042179835"
            caller_name = "Real Customer"
            dst = "1013"
            start = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            disposition = "ANSWERED"
            billsec = "120"
            duration = "130"
            uniqueid = $uniqueId
            userfield = "Inbound"
        }
    )
} | ConvertTo-Json

Write-Host "Sending Scenario 2: Inbound Answered (Update status to Green)..." -ForegroundColor Green
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body2

# SCENARIO 3: OUTBOUND ATTENDED (Blue Icon)
$body3 = @{
    cdr_root = @(
        @{
            src = "1002"
            dst = "19998887776"
            disposition = "ANSWERED"
            billsec = "45"
            userfield = "Outbound"
            uniqueid = "OB_TEST_" + (Get-Date).Ticks
        }
    )
} | ConvertTo-Json

Write-Host "Sending Scenario 3: Outbound Attended (Blue Icon)..." -ForegroundColor Blue
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body3

# SCENARIO 4: INTERNAL CALL (Should be ignored)
$body4 = @{
    cdr_root = @(
        @{
            src = "1014"
            dst = "1005"
            disposition = "ANSWERED"
            userfield = "Inbound"
            uniqueid = "INTERNAL_TEST_" + (Get-Date).Ticks
        }
    )
} | ConvertTo-Json

Write-Host "Sending Scenario 4: Internal/Extension (Should be skipped)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body4

Write-Host "`nAll tests sent. Check your CRM now!" -ForegroundColor Gray
