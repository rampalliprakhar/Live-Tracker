const socket = io();
const locationHistory = [];
const connectedUsers = [];
const markers = {};
let debounceTimer;
let watchId; // Variable to store the watch ID
let isLocationSharing = false; // Track location sharing status

// Function to send location to the server
const sendLocation = (latitude, longitude) => {
    socket.emit("send-location", { latitude, longitude });
};

// Function to handle geolocation
const handleGeolocation = () => {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => sendLocation(latitude, longitude), 1000);
            },
            (error) => {
                console.error(error);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert("User denied the request for Geolocation. Please enable location services.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert("Location information is unavailable. Please check your GPS signal.");
                        break;
                    case error.TIMEOUT:
                        alert("The request to get user location timed out. Please try again.");
                        break;
                    case error.UNKNOWN_ERROR:
                        alert("An unknown error occurred. Please try again.");
                        break;
                }
            },
            {
                enableHighAccuracy: true, // Request high accuracy
                timeout: 20000, // Increased timeout to 20 seconds
                maximumAge: 0,
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Toggle location sharing
document.getElementById("toggleLocation").addEventListener("click", () => {
    isLocationSharing = !isLocationSharing; // Toggle the flag
    if (isLocationSharing) {
        handleGeolocation(); // Start sharing location
        document.getElementById("toggleLocation").innerText = "Stop Location Sharing";
    } else {
        navigator.geolocation.clearWatch(watchId); // Clear the watch
        document.getElementById("toggleLocation").innerText = "Start Location Sharing";
    }
});

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
    const { id, latitude, longitude } = data; // Exclude profile for this implementation
    map.setView([latitude, longitude]);
    locationHistory.push({ id, latitude, longitude });

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]); // Update existing marker
    } else {
        // Create a marker and add it to the map
        markers[id] = L.marker([latitude, longitude]).addTo(map);
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
    if (!connectedUsers.includes(data.id)) {
        connectedUsers.push(data.id);
        updateConnectedUsers(); // Update the UI
    }
});

// Alert when a user goes offline
socket.on("user-offline", (data) => {
    alert(`User ${data.id} has gone offline.`);
    const index = connectedUsers.indexOf(data.id);
    if (index > -1) {
        connectedUsers.splice(index, 1); // Remove the user from the array
        updateConnectedUsers(); // Update the UI
    }
});

// Add geocoder control to the map
L.Control.geocoder().addTo(map);