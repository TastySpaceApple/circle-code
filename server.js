const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

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