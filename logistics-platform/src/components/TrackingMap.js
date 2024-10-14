import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust this import as needed

const TrackingMap = ({ bookingId }) => {
    const [driverLocation, setDriverLocation] = useState(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);

    useEffect(() => {
        const fetchDriverLocation = async () => {
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingDoc = await getDoc(bookingRef);
            if (bookingDoc.exists()) {
                const location = bookingDoc.data().driverLocation;
                console.log("Fetched driver location:", location);
                if (location) {
                    setDriverLocation(location);
                }
            } else {
                console.log("No such booking document!"); // Add this line
            }
        };

        const interval = setInterval(fetchDriverLocation, 5000); // Fetch every 5 seconds
        fetchDriverLocation(); // Initial fetch
        return () => clearInterval(interval);
    }, [bookingId]);

    useEffect(() => {
        if (driverLocation) {
            console.log("Driver Location received in TrackingMap:", driverLocation);
            if (!map) {
                // Initialize the map if it hasn't been initialized
                const newMap = L.map('map').setView([driverLocation.latitude, driverLocation.longitude], 15);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                }).addTo(newMap);
                setMap(newMap);
                // Add initial marker
                const newMarker = L.marker([driverLocation.latitude, driverLocation.longitude]).addTo(newMap)
                    .bindPopup('Driver Location')
                    .openPopup();
                setMarker(newMarker);
                console.log("Map initialized at:", driverLocation.latitude, driverLocation.longitude);
            } else {
                // Update the marker position and center the map
                if (marker) {
                    marker.setLatLng([driverLocation.latitude, driverLocation.longitude]);
                    map.setView([driverLocation.latitude, driverLocation.longitude], 15); // Center the map on the new location
                    console.log("Marker updated to:", driverLocation.latitude, driverLocation.longitude);
                }
            }
        }
    }, [driverLocation, map]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (map) {
                map.remove(); // Clean up the map
            }
        };
    }, [map]);

    return <div id="map" style={{ height: '400px', width: '100%' }}> {console.log("Map div rendered")}</div>;
};

export default TrackingMap;
