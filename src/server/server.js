const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../build')));

// Development-only middleware
if (process.env.NODE_ENV === 'development') {
  const chokidar = require('chokidar');
  const watcher = chokidar.watch(path.join(__dirname, '../../build'));

  watcher.on('ready', () => {
    watcher.on('all', () => {
      console.log('Frontend build updated');
    });
  });
}

// Routes
app.use('/api', require('./routes'));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../build/index.html'));
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
