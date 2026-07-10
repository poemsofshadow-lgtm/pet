<#
  cloud_run_deploy.ps1
  - Assumes Google Cloud SDK (`gcloud`) is installed and you are authenticated.
  - Edit `$projectId`, `$region` and any FIREBASE_* env values below before running.
#>

param()

$projectId = "studio-2802826130-fb025"
$region = "us-central1"
$service = "auau-backend"
$image = "gcr.io/$projectId/$service"

function Check-Gcloud {
  $g = Get-Command gcloud -ErrorAction SilentlyContinue
  if (-not $g) {
    Write-Error "gcloud não encontrado. Instale o Google Cloud SDK e rode este script novamente. https://cloud.google.com/sdk/docs/install#windows"
    exit 1
  }
}

Check-Gcloud

Write-Output "Usando PROJECT_ID=$projectId, REGION=$region"

Write-Output "Autenticando (se necessário)..."
gcloud auth login --quiet
gcloud config set project $projectId --quiet

Write-Output "Habilitando APIs necessárias..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com iam.googleapis.com --quiet

Write-Output "Enviando build para Container Registry..."
gcloud builds submit --tag $image .

Write-Output "Criando service account (se já existir, será ignorado)..."
try {
  & gcloud iam service-accounts create "$($service)-sa" --display-name "$service Cloud Run SA" --quiet
} catch {
  Write-Output "Service account pode já existir ou ocorreu erro (continuando): $($_.Exception.Message)"
}

$saEmail = "$($service)-sa@$projectId.iam.gserviceaccount.com"
Write-Output "Dando permissão Firestore ao service account: $saEmail"
gcloud projects add-iam-policy-binding $projectId --member="serviceAccount:$saEmail" --role="roles/datastore.user" --quiet

Write-Output "Deployando para Cloud Run..."
& gcloud run deploy $service --image $image --platform managed --region $region --service-account $saEmail --allow-unauthenticated --port 8080 --quiet

Write-Output "Recuperando URL do serviço..."
$url = gcloud run services describe $service --region $region --platform managed --format="value(status.url)"
Write-Output "Service URL: $url"

Write-Output "ATENÇÃO: defina as variáveis de ambiente do Firebase (FIREBASE_*) ou use Secret Manager. Exemplo para atualizar env vars:"
$exampleCmd = "gcloud run services update $service --update-env-vars `"FIREBASE_API_KEY=your_key,FIREBASE_PROJECT_ID=$projectId,FIREBASE_AUTH_DOMAIN=your_auth_domain,FIREBASE_FIRESTORE_DATABASE_ID=(default)`" --region $region --platform managed"
Write-Output $exampleCmd

Write-Output "Teste rápido: curl $url/api/db-state"
