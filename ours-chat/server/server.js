const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDatabase = require('./config/db');
const registerSockets = require('./sockets');

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL;
const corsOrigin = clientUrl ? clientUrl.split(',').map(u => u.trim()) : true;

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true
  }
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_, res) => res.json({ ok: true, name: 'OURS API' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));

// Serve static React client assets in production
const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: 'Something went wrong on the server.' });
});

registerSockets(io);

const port = process.env.PORT || 5000;
connectDatabase().then(() => {
  server.listen(port, () => console.log(`OURS listening on http://localhost:${port}`));
}).catch((error) => {
  console.error('Database connection failed:', error.message);
  process.exit(1);
});

