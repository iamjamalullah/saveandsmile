$pw = Read-Host "Apna Supabase database password likhein"
$url = "DATABASE_URL=postgresql://postgres.piocbtkjzznzzdftyelh:${pw}@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
Set-Content -Path 'd:\D New\Gaget store\gadget-store\.env' -Value $url -Encoding utf8
Write-Host "Done! .env file saved successfully!"
