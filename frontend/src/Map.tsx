// frontend/src/Map.tsx
import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import * as esri from 'esri-leaflet';

const Map: React.FC = () => {
  useEffect(() => {
    // Create the map object, specifying the center and zoom level
    const map = L.map('map', {
      center: [37.7749, -122.4194], // Coordinates of San Francisco, you can change this
      zoom: 12,
    });

    // Add an Esri basemap layer (you can choose other basemaps as needed)
    esri.basemapLayer('Streets').addTo(map);

    // Optionally add other map layers or features here

    // Cleanup on component unmount to prevent memory leaks
    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      id="map"
      className="w-full h-[45rem] md:h-112 lg:h-128 rounded-lg shadow-lg"
    />
  );
};

export default Map;

