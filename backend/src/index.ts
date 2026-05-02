import dotenv from 'dotenv';
import app, { primeWarmCaches } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Security layers: HTTPS-Enforce, Helmet+CSP, Sanitizer, GlobalErrorHandler');

  void primeWarmCaches().catch((error) => {
    console.error('Failed to warm caches after server start:', error);
  });
});

server.on('error', (error) => {
  console.error('Server failed:', error);
  process.exit(1);
});
