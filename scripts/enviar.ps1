$body = @{
    telefone = "5584996066876"
    mensagem = "Teste"
} | ConvertTo-Json -Compress

$headers = @{
    "x-hub-token" = "5e72ab92faf43114c75680436041d02157ba67ff74c3ffe54e0a5dd9a4668c3d"
}

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:5000/send" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 60
    Write-Host "RESPOSTA: $($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "ERRO: $($_.Exception.Message)"
}
