const path = require('path');
const express = require('express');
const http = require('http');
const socket = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

let connectedUsers = {};    // store connected users

// Handle socket connections
io.on("connection", (socket) => {
    console.log("New user connected: " + socket.id);
    
    // Add users to connectedUsers
    connectedUsers[socket.id] = {id: socket.id, location:null};

    // Notify users when a new user connects
    socket.broadcast.emit("user-online", { id: socket.id });
    
    // Listen for location updates from the client
    socket.on("send-location", (data) => {
        connectedUsers[socket.id].location = data;
        socket.broadcast.emit("receive-location", { id: socket.id, ...data }); // Broadcast location to others
    });

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
        delete connectedUsers[socket.id]; // Remove the user from the connectedUsers
        socket.broadcast.emit("user-offline", { id: socket.id }); // Notify others when a user disconnects
    });
});

// Render the main page
app.get("/", (req, res) => {
    res.render("index");
});

// Start the server
server.listen(3000, () => {
    console.log("Server is running on port 3000");
});