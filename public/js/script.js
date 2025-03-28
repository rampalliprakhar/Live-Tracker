const socket = io();
const locationHistory = [];
const connectedUsers = [];
const markers = {};
let debounceTimer;
let watchId; // Variable to store the watch ID
let isLocationSharing = false; // Track location sharing status
const userPaths = {}; // Store user paths

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
                timeout: 50000, // Increased timeout to 50 seconds
                maximumAge: 0,
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Toggle location sharing
document.getElementById("toggleLocation").addEventListener("click", () => {
    const button = document.getElementById("toggleLocation");
    
    // Temporarily disable to avoid multiple clicks
    button.disabled = true;

    // Toggle location sharing
    isLocationSharing = !isLocationSharing;

    if (isLocationSharing) {
        handleGeolocation(); // Start sharing location
        button.innerText = "Stop Location Sharing";
        button.disabled = false; // Disable button while waiting for location
    } else {
        if(watchId){
            navigator.geolocation.clearWatch(watchId); // Stop sharing location
            watchId = null;                            // Clear the watch ID
        }
        button.innerText = "Start Location Sharing";    // Reset button text
        button.disabled = false;                     // Re-enable the button
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

// Loading state
const button = document.getElementById("toggleLocation");
button.innerHTML = '<span class="spinner"></span> Getting Location...';

// Update markers on the map
const updateMarkers = (map, data) => {
    const { id, latitude, longitude } = data;

    // Path array for new user
    if (!userPaths[id]) {
        userPaths[id] = [];
    }

    userPaths[id].push([latitude, longitude]);

    if (userPaths[id].length > 1) {
        if (markers[id].polyline) {
            markers[id].polyline.setLatLngs(userPaths[id]); // Update the polyline
        } else {
            markers[id].polyline = L.polyline(userPaths[id], { 
                color: "#" + Math.floor(Math.random() * 16777215).toString(16),
                weight: 3,
                opacity: 0.7
            }).addTo(map);
        }
    }

    // Update or create a new marker for the user
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]); // Update existing marker
    } else {
        // Create a marker and add it to the map
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    // Update the map view to center on the user's location
    map.setView([latitude, longitude], map.getZoom());
    
    // // Store the location history
    // locationHistory.push({ id, latitude, longitude });
};

// Remove markers when user disconnects
const removeMarker = (map, id) => {
    if (markers[id]) {
        if (markers[id].polyline) {
            map.removeLayer(markers[id].polyline); // Remove the polyline
        }
        map.removeLayer(markers[id]);   // Remove the marker from the map
        delete markers[id];             // Delete the marker from the markers object
        delete userPaths[id];            // Delete the user's path
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
L.Control.geocoder().addTo(map)
    .on('markgeocode', function(e) {
        const searchedLocation = e.geocode.center;
        const userId = socket.id;

        // Obtain user's current location
        if (markers[userId]) {
            const currentLocation = markers[userId].getLatLng();

            // Create path from user's current location to the searched location
            const routePath = L.polyline([
                [currentLocation.lat, currentLocation.lng],
                [searchedLocation.lat, searchedLocation.lng]
            ], {
                color: '#FF4444',
                weight: 4,
                dashArray: '10, 10',
                opacity: 0.8
            }).addTo(map);

            // Store reference to the route path
            markers[userId].searchRoute = routePath;
        }
    })
;