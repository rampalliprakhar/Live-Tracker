const path = require('path');
const express = require('express');
const http = require('http');
const socket = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Handle socket connections
io.on("connection", (socket) => {
    console.log("New user connected: " + socket.id);

    // Notify others when a user connects
    socket.broadcast.emit("user-online", { id: socket.id }); 

    // Listen for location updates from the client
    socket.on("send-location", (data) => {
        // console.log(`Location received from ${socket.id}: `, data)
        // Broadcast location to others
        io.emit("receive-location", { id: socket.id, ...data }); 
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
        // Notify others when a user disconnects
        socket.broadcast.emit("user-offline", { id: socket.id }); 
    });
});

// Render the main page
app.get("/", (req, res) => {
    res.render("index");
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});