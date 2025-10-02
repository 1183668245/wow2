const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const lyricsRoutes = require('./routes/lyrics');
const nftRoutes = require('./routes/nft');
const shareRoutes = require('./routes/share');
const songsRoutes = require('./routes/songs');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            mediaSrc: ["'self'", "https:"],
            connectSrc: ["'self'", "https:"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

 
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

   
const allowedOrigins = [
  'https://localhost:3000',
  'https://localhost:8000',
  'https://127.0.0.1:5500',
  'null',
  'https://pmelody.top',
  'https://www.pmelody.top',
  'https://ariamusic.buzz',
  'https://www.ariamusic.buzz',
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
       
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

   
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,    
  max: 500,    
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

   
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

   
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/songs', songsRoutes);

   
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

   
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

   
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

   
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;