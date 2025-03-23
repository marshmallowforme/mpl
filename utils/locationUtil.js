const axios = require('axios');

/**
 * Geocode an address to coordinates using OpenStreetMap Nominatim API
 * @param {string} address - Full address to geocode
 * @returns {Promise<{lat: number, lng: number}>} - Coordinates
 */
exports.geocodeAddress = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'StudentMarketplace/1.0'
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lon)
      };
    }
    
    throw new Error('Location not found');
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Address components
 */
exports.reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'StudentMarketplace/1.0'
        }
      }
    );

    if (response.data) {
      const { address } = response.data;
      return {
        street: `${address.road || ''} ${address.house_number || ''}`.trim(),
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        zipcode: address.postcode || '',
        country: address.country || '',
        formatted: response.data.display_name
      };
    }
    
    throw new Error('Address not found');
  } catch (error) {
    throw new Error(`Reverse geocoding failed: ${error.message}`);
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
exports.calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Parse location string into components
 * @param {string} locationString - Location string (e.g., "City, State, Country")
 * @returns {Object} - Location components
 */
exports.parseLocationString = (locationString) => {
  const parts = locationString.split(',').map(part => part.trim());
  
  let city, state, country;
  
  if (parts.length === 1) {
    city = parts[0];
  } else if (parts.length === 2) {
    city = parts[0];
    state = parts[1];
  } else if (parts.length >= 3) {
    city = parts[0];
    state = parts[1];
    country = parts[2];
  }
  
  return { city, state, country };
};