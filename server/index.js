const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const linksRouter = require('./Routes/linksRoutes');
const { redirectBySlug } = require('./controllers/linkControllers');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/shorty';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ===== Middlewares =====
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

// ===== API Routes =====
// كل المسارات تحت /api/links
app.use('/api/links', linksRouter);

// ===== Redirect Route =====
// لازم يكون آخر شيء
// عشان أي رابط قصير مثل http://localhost:5000/slug
app.get('/:slug', redirectBySlug);

// ===== Health Check =====
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ===== Connect to MongB and Start Server =====
mongoose
  .connect(MONGO_URL, {
    dbName: new URL(MONGO_URL).pathname.replace('/', '') || 'shorty',
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    app.listen(PORT, () =>
      console.log(`⚠️ Server running WITHOUT DB on http://localhost:${PORT}`)
    );
  });
