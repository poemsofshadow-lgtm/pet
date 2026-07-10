Cloud Run deployment steps

1) Build and push image (replace PROJECT_ID and REGION):

```bash
# from project root
gcloud builds submit --tag gcr.io/PROJECT_ID/auau-backend
```

2) Deploy to Cloud Run:

```bash
gcloud run deploy auau-backend \
  --image gcr.io/PROJECT_ID/auau-backend \
  --platform managed \
  --region REGION \
  --allow-unauthenticated \
  --port 8080
```

3) Set service account (recommended) with Firestore access and re-deploy:

```bash
# create or use existing service account
gcloud iam service-accounts create auau-run-sa --display-name "AuAu Cloud Run SA"
gcloud projects add-iam-policy-binding PROJECT_ID --member="serviceAccount:auau-run-sa@PROJECT_ID.iam.gserviceaccount.com" --role="roles/datastore.user"

gcloud run deploy auau-backend \
  --image gcr.io/PROJECT_ID/auau-backend \
  --platform managed \
  --region REGION \
  --service-account auau-run-sa@PROJECT_ID.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --port 8080
```

4) Environment variables

Set your Firebase config as env vars on Cloud Run (or use Secret Manager):

```bash
gcloud run services update auau-backend \
  --update-env-vars "FIREBASE_API_KEY=...,FIREBASE_PROJECT_ID=...,FIREBASE_AUTH_DOMAIN=...,FIREBASE_FIRESTORE_DATABASE_ID=(default)"
```

5) Frontend configuration

- Option A (recommended): Configure frontend to call full API URL from Cloud Run (e.g., `https://auau-backend-xxxxx.a.run.app`). Replace relative fetch calls with `API_BASE_URL + '/api/..'` or set `window.__API_BASE__` at build time.
- Option B: Keep relative `/api/` calls and add a rewrite in `firebase.json` to proxy `/api/**` to the Cloud Run service using `run` rewrites (requires Firebase project linking).

6) Test

After deploy, call `https://SERVICE_URL/api/db-state` to confirm JSON is returned.
