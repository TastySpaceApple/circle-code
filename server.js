import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve the static file recognize.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'recognize.html'));
});

// Serve the static folder images
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/', express.static(path.join(__dirname, 'web')));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});