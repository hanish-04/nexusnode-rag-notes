// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./utils/db.js');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running normally' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});