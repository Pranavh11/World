# 🚀 Deploying OURS Chat to Render

OURS Chat is configured to build and deploy as a single full-stack Web Service on [Render](https://render.com), serving both the React client interface and the Express/Socket.IO backend from one service.

---

## Step 1: Push Project to GitHub

1. Initialize git if not already done:
   ```bash
   git init
   git add .
   git commit -m "Prepare OURS for deployment"
   ```
2. Push your repo to GitHub.

---

## Step 2: Configure MongoDB Atlas

1. Log into your [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
2. Go to **Network Access** under Security.
3. Click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render cloud instances can connect to your database.
4. Copy your MongoDB Connection String (e.g., `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/ours?retryWrites=true&w=majority`).

---

## Step 3: Deploy on Render

### Option A: Using Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml`.
5. Enter your `MONGO_URI` when prompted and click **Apply**.

### Option B: Manual Web Service Setup
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository.
4. Configure settings:
   - **Name**: `ours-chat`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/ours?retryWrites=true&w=majority`
   - `JWT_SECRET` = *(Any long random secret string)*
   - *(Optional)* `CLOUDINARY_CLOUD_NAME` = *(Your Cloudinary Cloud Name)*
   - *(Optional)* `CLOUDINARY_API_KEY` = *(Your Cloudinary API Key)*
   - *(Optional)* `CLOUDINARY_API_SECRET` = *(Your Cloudinary API Secret)*
6. Click **Create Web Service**.

---

## Step 4: Verification

Once deployed:
1. Open your Render web service URL (e.g. `https://ours-chat.onrender.com`).
2. Test registering two user accounts and exchanging real-time messages!
