// frontend/src/Map.tsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import GeoRasterLayer from 'georaster-layer-for-leaflet'; // Import GeoRasterLayer
import parseGeoraster from 'georaster';

const Map: React.FC = () => {
  // Use a ref to store the map instance
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Check if the map is already initialized
    if (!mapRef.current) {
      // Initialize the map only if it's not already initialized
      mapRef.current = L.map('map').setView([0, 0], 5);

      // Add OpenStreetMap basemap
      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      const url_to_geotiff_file = "https://storage.googleapis.com/pdd-stac/disasters/hurricane-harvey/0831/20170831_172754_101c_3b_Visual.tif";

      parseGeoraster(url_to_geotiff_file).then((georaster: any) => {
        console.log("georaster:", georaster);

        const layer = new GeoRasterLayer({
          attribution: 'Planet',
          georaster: georaster,
          resolution: 128
           // Adjust resolution for better performance or visual quality
        });

        layer.addTo(mapRef.current);

        // Fit the map to the bounds of the raster layer
        if(!mapRef.current) return;
        mapRef.current.fitBounds(layer.getBounds());
      });
    }

    // Cleanup map when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove(); // Remove the map instance from the DOM
        mapRef.current = null; // Clear the ref
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once when the component mounts

  return (
    <div
      id="map"
      className="w-full h-[45rem] md:h-112 lg:h-128 rounded-lg shadow-lg"
    />
  );
};

export default Map;
