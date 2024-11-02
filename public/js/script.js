const socket = io();

const handleGeolocation = () => {
    // Checks whether the navigator allows geolocation
    if(navigator.geolocation){
        navigator.geolocation.watchPosition(
            (position) => {
                const {latitude, longitude} = position.coords;
                socket.emit("send-location", {latitude, longitude});
            },
            (error) => {
                console.error(error);
                alert("Unable to retrieve your location. Please check your settings."); // User feedback
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
    const map = L.map("map").setView([0,0], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "Live Tracker"
    }).addTo(map);
    return map;
};

// Update markers on the map
const updateMarkers = (map, data) => {
    const {id, latitude, longitude} = data;
    map.setView([latitude, longitude]);
    if(markers[id]){
        markers[id].setLatLng([latitude, longitude]);
    } else{
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
};

// Remove markers when user disconnects
const removeMarker = (map, id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
};

// Execution
const map = initializeMap();
const markers = {};
handleGeolocation();
// Receiving location
socket.on("receive-location", (data) => updateMarkers(map, data));
// Removes the pointer from the location when user leaves the website
socket.on("user-disconnected", (id)=> removeMarker(map, id));
// Add geocoder control
L.Control.geocoder().addTo(map);
