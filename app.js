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

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
        socket.broadcast.emit("user-offline", { id: socket.id }); // Notify others when a user disconnects
    });
});

// Render the main page
app.get("/", (req, res) => {
    res.render("index");
})

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});