const express = require('express');
const path = require('path');
const app = express();

// Port configuration for Railway
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.static('.'));

// Main site routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Emanet takip redirect
app.get('/emanettakip', (req, res) => {
    res.redirect('/emanettakip/');
});

app.get('/emanettakip/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/emanettakip/index.html'));
});

// Handle all other routes - return main site
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Emanet Takip: https://localhost:${PORT}/emanettakip/`);
});

module.exports = app; 