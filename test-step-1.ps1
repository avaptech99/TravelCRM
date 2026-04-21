# STEP 1: INITIAL ICONS
$url = "https://travelcrm-testing.onrender.com/api/webhook/missed-call"
$headers = @{
    "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("gdms_user:SuperSecret123!"))
    "Content-Type"  = "application/json"
}

Write-Host "--- STEP 1: CREATING 3 DIFFERENT ICONS ---" -ForegroundColor Yellow

# CUSTOMER 1 -> MISSED (RED)
$body1 = @{ cdr_root = @( @{ src="1111111111"; dst="1000"; disposition="NO ANSWER"; userfield="Inbound"; uniqueid="T1_"+(Get-Date).Ticks } ) } | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body1
Write-Host "Customer 1: Sent Missed call (RED)" -ForegroundColor Red

# CUSTOMER 2 -> ANSWERED (GREEN)
$body2 = @{ cdr_root = @( @{ src="2222222222"; dst="1000"; disposition="ANSWERED"; billsec="60"; userfield="Inbound"; uniqueid="T2_"+(Get-Date).Ticks } ) } | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body2
Write-Host "Customer 2: Sent Answered call (GREEN)" -ForegroundColor Green

# CUSTOMER 3 -> OUTBOUND (BLUE)
$body3 = @{ cdr_root = @( @{ src="1013"; dst="3333333333"; disposition="ANSWERED"; billsec="30"; userfield="Outbound"; uniqueid="T3_"+(Get-Date).Ticks } ) } | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body3
Write-Host "Customer 3: Sent Outbound call (BLUE)" -ForegroundColor Blue

Write-Host "`nStep 1 Done! Check your CRM now." -ForegroundColor Gray
