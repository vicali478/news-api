const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Load your models and routes (adjust paths as needed)
const models = require('./models');
const routes  = require('./routes');
const movieId  = require('./id');
app.use('/v1', routes);
app.use('/movie/:id', movieId.id);

// Root route
app.get("/", (req, res) => {
  res.send("NEWS API is running");
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).send("Not Found");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Import and initialize Socket.IO logic
require('./socket/radio-socket')(io);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
