import axios from 'axios';

// Create a cache object
const geocodeCache = {};

// Function to get the coordinates (lat, lon) for an address using Nominatim (OSM geocoding)
const getCoordinatesFromAddress = async (address) => {
    // Check if the coordinates for the address are already in cache
    if (geocodeCache[address]) {
        console.log('Returning cached coordinates for address:', address);
        return geocodeCache[address];
    }

    console.log('Fetching coordinates for address:', address); // Debug log

    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q: address,
                format: 'json',
                limit: 1
            }
        });

        console.log('Nominatim response for address:', address, response.data); // Log the response

        const data = response.data;

        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            // Cache the result
            geocodeCache[address] = { lat, lon };
            return { lat, lon };
        } else {
            console.error('Error finding coordinates for the address: ', address);
            return null;
        }
    } catch (error) {
        console.error('Error fetching coordinates from OpenStreetMap: ', error);
        return null;
    }
};

// Function to calculate distance using OSRM
export const getDistanceBetweenLocations = async (pickup, dropoff) => {
    try {
        // Get coordinates for pickup and dropoff locations
        const pickupCoords = await getCoordinatesFromAddress(pickup);
        const dropoffCoords = await getCoordinatesFromAddress(dropoff);

        if (!pickupCoords || !dropoffCoords) {
            console.error('Failed to retrieve coordinates for either pickup or dropoff location.');
            return null;
        }

        const { lat: pickupLat, lon: pickupLon } = pickupCoords;
        const { lat: dropoffLat, lon: dropoffLon } = dropoffCoords;

        // OSRM API call to get route/distance between the two coordinates
        const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${pickupLon},${pickupLat};${dropoffLon},${dropoffLat}`, {
            params: {
                overview: 'false'  // This reduces the size of the response, you only get the distance and duration
            }
        });

        const data = response.data;

        if (data.routes && data.routes.length > 0) {
            // Distance in meters
            const distanceInMeters = data.routes[0].distance;
            // Convert to kilometers
            const distanceInKilometers = distanceInMeters / 1000;
            return distanceInKilometers;
        } else {
            console.error('Error calculating distance: ', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching distance from OSRM API: ', error);
        return null;
    }
};
