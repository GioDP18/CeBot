# Deploying CeBot Backend to Vercel

This guide walks through the process of deploying the CeBot backend API to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. The [Vercel CLI](https://vercel.com/download) (optional)
3. Your Google Cloud service account key

## Step 1: Prepare Your Service Account Key

Since Vercel doesn't support file-based credentials, you need to convert your Google service account key to a format that can be stored as an environment variable:

1. Open your `service-account-key.json` file
2. Convert the entire JSON content to a single line (remove all newlines)
3. This string will be used as an environment variable in Vercel

## Step 2: Deploy to Vercel

### Option A: Deploy from Vercel Dashboard

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your repository
4. Select "Node.js" as the Framework Preset
5. Configure the following settings:
   - **Root Directory**: `backend` (if deploying from the root repo with both frontend and backend)
   - **Build Command**: `npm install`
   - **Output Directory**: Leave blank
   - **Install Command**: `npm install`
   - **Development Command**: `npm run dev`

6. Click "Environment Variables" and add:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your MongoDB connection string
   - `DIALOGFLOW_PROJECT_ID` = your Dialogflow project ID
   - `DIALOGFLOW_LANGUAGE_CODE` = `en` (or your preferred language)
   - `JWT_SECRET` = your JWT secret
   - `CORS_ORIGIN` = your frontend domain (e.g., `https://cebot.vercel.app`)
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON` = your service account JSON string

7. Click "Deploy"

### Option B: Deploy using Vercel CLI

1. Install the Vercel CLI if you haven't already: `npm i -g vercel`
2. Navigate to your backend directory: `cd backend`
3. Run `vercel` and follow the prompts
4. When asked about environment variables, add all the ones listed above

## Step 3: Update Frontend Configuration

Once your backend is deployed, update your frontend `.env` file to point to the new backend URL:

```
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

## Step 4: Verify Deployment

Visit the health check endpoint at `https://your-backend-url.vercel.app/health` to verify your API is running properly.

## Troubleshooting

- **Serverless Function Execution Timeout**: Vercel has a default timeout of 10 seconds for serverless functions. If your API responses take longer, consider optimizing your code or using a different hosting provider.
- **Environment Variables**: If you're experiencing issues with Dialogflow, check that your `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable is set correctly.
- **CORS Issues**: Ensure your `CORS_ORIGIN` is set to the exact domain of your frontend.
