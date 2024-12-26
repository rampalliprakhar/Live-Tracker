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
    socket.broadcast.emit("user-online", { id: socket.id }); // Notify others when a user connects

    // Listen for location updates from the client
    socket.on("send-location", (data) => {
        socket.broadcast.emit("receive-location", { id: socket.id, ...data }); // Broadcast location to others
    });

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
        socket.broadcast.emit("user-offline", { id: socket.id }); // Notify others when a user disconnects
    });
});

// Render the main page
app.get("/", (req, res) => {
    res.render("index");
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});