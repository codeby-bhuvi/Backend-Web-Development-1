require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
  const status = Number(error.statusCode || error.status || 500);
  const code = status < 500 && error.code
    ? error.code
    : 'INTERNAL_ERROR';
  const message = status < 500
    ? error.message
    : 'Internal server error';

  if (status >= 500) {
    console.error('Internal server error');
  }

  res.status(status).json({
    error: { code, message }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;
