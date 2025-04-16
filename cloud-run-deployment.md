# Deploying to Google Cloud Run

This guide provides step-by-step instructions for deploying the nsplitter application to Google Cloud Run.

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
2. Google Cloud account with billing enabled
3. Docker installed locally (optional for local testing)

## Deployment Steps

### 1. Initial Setup

Set up your Google Cloud environment:

```bash
# Login to your Google Cloud account
gcloud auth login

# Select your project
gcloud config set project YOUR_PROJECT_ID

# Enable required services
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### 2. Build and Deploy

Option A: Build and deploy in one step (recommended):

```bash
# Deploy directly to Cloud Run
gcloud run deploy nsplitter \
  --source . \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1
```

Option B: Manual build and deploy:

```bash
# Build the container image using docker -- the password you set in the arg here will be used to access the website
docker buildx build --platform linux/amd64 --build-arg VITE_APP_PASSWORD=[PASSWORD] -t gcr.io/YOUR_PROJECT_ID/nsplitter --push .

# Deploy the container image to Cloud Run
gcloud run deploy nsplitter \
  --image gcr.io/YOUR_PROJECT_ID/nsplitter \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1
```

### 3. Access Your Application

After successful deployment, you'll receive a URL where your application is accessible:

```
Service [nsplitter] revision [nsplitter-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://nsplitter-abcdefghij-uc.a.run.app
```

## Maintenance and Updates

To update your application:

```bash
# Deploy a new version with the same command
gcloud run deploy nsplitter \
  --source . \
  --platform managed \
  --region us-central1
```

## Troubleshooting

If you encounter build issues:

1. Check Cloud Build logs:
   ```bash
   gcloud builds list
   gcloud builds log BUILD_ID
   ```

2. For container startup issues, check Cloud Run logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nsplitter" --limit 50
   ```

## Cleaning Up

To avoid incurring charges when you're done:

```bash
# Delete the Cloud Run service
gcloud run services delete nsplitter --region us-central1

# Delete the container image (optional)
gcloud container images delete gcr.io/YOUR_PROJECT_ID/nsplitter
```