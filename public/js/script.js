const socket = io();
const locationHistory = [];
const connectedUsers = [];
let debounceTimer;
const markers = {};

const sendLocation = (latitude, longitude) => {
    socket.emit("send-location", {latitude, longitude});
};


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
                alert("Unable to retrieve your location. Please check your settings.");
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
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
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
};

// Customize map based on the user preferences
const mapStyles = {
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://{s}.satellite.openstreetmap.org/{z}/{x}/{y}.png"
};

document.getElementById("mapStyle").addEventListener("change", (event) => {
    const selectedStyle = event.target.value;
    L.tileLayer(mapStyles[selectedStyle]).addTo(map);
});

// Remove markers when user disconnects
const removeMarker = (map, id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
};

// Display location history
const displayLocationHistory = (map) => {
    const polyline = L.polyline(locationHistory.map(loc => [loc.latitude, loc.longitude]), { color: 'blue' }).addTo(map);
};

const updateConnectedUsers = () => {
    document.getElementById("connectedUsers").innerHTML = connectedUsers.join(", ");
};

// Execution
const map = initializeMap();

handleGeolocation();
// Receiving location
socket.on("receive-location", (data) => updateMarkers(map, data));
// Removes the pointer from the location when user leaves the website
socket.on("user-disconnected", (id)=> removeMarker(map, id));
// Alert user when online
socket.on("user-online", (data) => {
    alert(`User ${data.id} is now online!`);
    connectedUsers.push(data.id);
    updateConnectedUsers();
});
// Alert when the user leaves
socket.on("user-offline", (data) => {
    alert(`User ${data.id} has gone offline.`);
    const index = connectedUsers.indexOf(data.id);
    if (index > -1) {
        connectedUsers.splice(index, 1);
    }
    updateConnectedUsers();
});
// Add geocoder control
L.Control.geocoder().addTo(map);
