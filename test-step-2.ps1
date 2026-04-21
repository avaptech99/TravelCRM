# STEP 2: FLIP THE COLORS
$url = "https://travelcrm-testing.onrender.com/api/webhook/missed-call"
$headers = @{
    "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("gdms_user:SuperSecret123!"))
    "Content-Type"  = "application/json"
}

Write-Host "--- STEP 2: SWITCHING THE BADGE COLORS ---" -ForegroundColor Yellow

# CUSTOMER 1: RED -> GREEN (Send Answered call)
$body1 = @{ cdr_root = @( @{ src="1111111111"; dst="1013"; disposition="ANSWERED"; billsec="100"; userfield="Inbound"; uniqueid="T1_UPD_"+(Get-Date).Ticks } ) } | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body1
Write-Host "Customer 1: Switched from Missed -> ANSWERED (GREEN)" -ForegroundColor Green

# CUSTOMER 2: GREEN -> BLUE (Send Outbound call)
$body2 = @{ cdr_root = @( @{ src="1013"; dst="2222222222"; disposition="ANSWERED"; billsec="50"; userfield="Outbound"; uniqueid="T2_UPD_"+(Get-Date).Ticks } ) } | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body2
Write-Host "Customer 2: Switched from Answered -> OUTBOUND (BLUE)" -ForegroundColor Blue

# CUSTOMER 3: BLUE -> RED (Send Missed call)
$body3 = @{ cdr_root = @( @{ src="3333333333"; dst="1000"; disposition="NO ANSWER"; userfield="Inbound"; uniqueid="T3_UPD_"+(Get-Date).Ticks } ) } | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body3
Write-Host "Customer 3: Switched from Outbound -> MISSED (RED)" -ForegroundColor Red

Write-Host "`nStep 2 Done! All icons should have flipped colors now." -ForegroundColor Gray
