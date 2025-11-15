const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { port } = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const debugRoutes = require('./routes/debug.routes');

function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/auth', authRoutes);
  app.use('/debug', debugRoutes);

  app.use((req, res) => {
    res.status(404).json({ ok: false });
  });

  return app;
}

function start() {
  const app = createServer();
  const server = app.listen(port, () => {
    // server started
  });
  return server;
}

module.exports = { createServer, start };