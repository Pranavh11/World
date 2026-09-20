# OURS

A private friends chat room: **a little place for us.**

OURS is a full-stack React + Vite and Node + Express application with MongoDB persistence, JWT authentication, bcrypt password hashing, Socket.IO realtime messaging, and optional Cloudinary image uploads.

## Requirements

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection
- Cloudinary account for image sharing

## Install

```bash
cd ours-chat
npm install
npm --prefix client install
npm --prefix server install
copy .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead of `copy`.

## Environment variables

Set these values in the root `.env` file:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/ours
JWT_SECRET=use-a-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Cloudinary values stay server-side. The browser only receives the resulting secure image URL.

## Run locally

Start both applications from the project root:

```bash
npm run dev
```

Or start each side separately:

```bash
npm --prefix server run dev
npm --prefix client run dev
```

The client runs at http://localhost:5173 and the API runs at http://localhost:5000.

## Test two users chatting

1. Register a first account in one browser window.
2. Register a second account in another browser or private window.
3. From the first account, choose the `+` action beside Recent rooms.
4. Enter the second account's username.
5. Send text, reply to a message, add a reaction, or attach an image.
6. Open both windows to see realtime delivery, typing, read receipts, online status, and message deletion.

Messages, conversations, users, and notifications are persisted in MongoDB. Image messages require the Cloudinary variables above.

## Production

Build the client with `npm run build`, serve the generated `client/dist` with your preferred static host, and run the server with `npm start`. Set `CLIENT_URL` to the deployed client origin, use a hosted MongoDB URI, store secrets in the deployment platform's environment settings, and put HTTPS in front of both the web app and WebSocket endpoint.

## Project layout

- `client/src/components`: responsive chat, sidebar, and profile surfaces
- `client/src/context`: auth state and token lifecycle
- `client/src/pages`: auth and chat pages
- `client/src/services`: API client
- `server/models`: Mongoose User, Conversation, Message, and Notification models
- `server/routes`: protected auth, user search, conversation, and upload APIs
- `server/sockets`: authenticated Socket.IO events
