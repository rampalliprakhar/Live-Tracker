const socket = io();
const locationHistory = [];
const connectedUsers = [];
let debounceTimer;
const markers = {};

// Function to send location to the server
const sendLocation = (latitude, longitude) => {
    socket.emit("send-location", { latitude, longitude });
};

// Function to handle geolocation
const handleGeolocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => sendLocation(latitude, longitude), 1000);
            },
            (error) => {
                console.error(error);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert("User denied the request for Geolocation.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        alert("The request to get user location timed out. Please try again.");
                        break;
                    case error.UNKNOWN_ERROR:
                        alert("An unknown error occurred.");
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000, // Increased timeout to 10 seconds
                maximumAge: 0,
            }
        );
    }
};

// Initialize the map
const initializeMap = () => {
    const map = L.map("map").setView([0, 0], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "Live Tracker"
    }).addTo(map);
    return map;
};

// Update markers on the map
const updateMarkers = (map, data) => {
    const { id, latitude, longitude } = data;
    map.setView([latitude, longitude]);
    locationHistory.push({ id, latitude, longitude });

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]); // Update existing marker
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map); // Add new marker
    }
};

// Remove markers when user disconnects
const removeMarker = (map, id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
};

// Update the list of connected users
const updateConnectedUsers = () => {
    document.getElementById("connectedUsers").innerHTML = connectedUsers.join(", ");
};

// Execution
const map = initializeMap();
handleGeolocation();

// Receiving location updates from the server
socket.on("receive-location", (data) => updateMarkers(map, data));

// Remove marker when user disconnects
socket.on("user-disconnected", (id) => removeMarker(map, id));

// Alert user when another user comes online
socket.on("user-online", (data) => {
    alert(`User ${data.id} is now online!`);
    connectedUsers.push(data.id);
    updateConnectedUsers();
});

// Alert when a user goes offline
socket.on("user-offline", (data) => {
    alert(`User ${data.id} has gone offline.`);
    const index = connectedUsers.indexOf(data.id);
    if (index > -1) {
        connectedUsers.splice(index, 1);
    }
    updateConnectedUsers();
});

// Add geocoder control to the map
L.Control.geocoder().addTo(map);