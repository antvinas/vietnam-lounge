import { LatLngLiteral } from './types'; // Assuming a type definition exists

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Converts an address string to latitude and longitude coordinates.
 * Caches results in session storage to avoid redundant API calls.
 * 
 * @param address The address to geocode.
 * @returns A promise that resolves to a LatLngLiteral object or null.
 */
export const geocodeAddress = async (address: string): Promise<LatLngLiteral | null> => {
    const cacheKey = `geocode_${address.replace(/\s+/g, '_')}`;
    const cachedResult = sessionStorage.getItem(cacheKey);

    if (cachedResult) {
        
        return JSON.parse(cachedResult);
    }

    
    try {
        const response = await fetch(`${BASE_URL}?address=${encodeURIComponent(address)}&key=${API_KEY}`);
        const data = await response.json();

        if (data.status === 'OK' && data.results[0]) {
            const location = data.results[0].geometry.location; // { lat, lng }
            sessionStorage.setItem(cacheKey, JSON.stringify(location));
            return location;
        } else {
            console.error('Geocoding failed:', data.status, data.error_message);
            return null;
        }
    } catch (error) {
        console.error('Error during geocoding request:', error);
        return null;
    }
};
