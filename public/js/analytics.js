const analytics = {
    trackingData: {
        startTime: null,
        distance: 0,
        points: [],
        useMetric: true // Toggle between metric and imperial
    },

    startTracking() {
        this.trackingData.startTime = new Date();
    },

    toggleUnits() {
        this.trackingData.useMetric = !this.trackingData.useMetric;
    },

    calculateDistance(point1, point2) {
        const latDiff = Math.abs(point2.lat - point1.lat);
        const lngDiff = Math.abs(point2.lng - point1.lng);
        const kmPerLat = 111;
        const kmPerLng = Math.cos(point1.lat * Math.PI/180) * 111;
        
        return Math.sqrt(
            Math.pow(latDiff * kmPerLat, 2) + 
            Math.pow(lngDiff * kmPerLng, 2)
        );
    },

    getFormattedDistance() {
        const km = this.trackingData.distance;
        const miles = km * 0.621371;
        return this.trackingData.useMetric 
            ? `${km.toFixed(2)} km` 
            : `${miles.toFixed(2)} mi`;
    },

    getFormattedSpeed() {
        const kmh = this.calculateAverageSpeed();
        const mph = kmh * 0.621371;
        return this.trackingData.useMetric 
            ? `${kmh} km/h` 
            : `${mph.toFixed(1)} mph`;
    },

    getTrackingDuration() {
        if (!this.trackingData.startTime) return "00:00:00";
        const diff = new Date() - this.trackingData.startTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    calculateAverageSpeed() {
        if (!this.trackingData.startTime) return 0;
        const duration = (new Date() - this.trackingData.startTime) / 3600000;
        return duration > 0 ? (this.trackingData.distance / duration).toFixed(1) : 0;
    },

    updateDistance(newPoint) {
        if (this.trackingData.points.length > 0) {
            const lastPoint = this.trackingData.points[this.trackingData.points.length - 1];
            this.trackingData.distance += this.calculateDistance(lastPoint, newPoint);
        }
        this.trackingData.points.push(newPoint);
    },
    
    generateReport() {
        return {
            duration: this.getTrackingDuration(),
            totalDistance: this.getFormattedDistance(),
            averageSpeed: this.getFormattedSpeed()
        };
    }
};