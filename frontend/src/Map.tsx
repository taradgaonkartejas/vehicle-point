import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import GeoRasterLayer from 'georaster-layer-for-leaflet'; // Import GeoRasterLayer
import parseGeoraster from 'georaster';
import proj4 from 'proj4'; // Import proj4js for coordinate transformation
import axios from 'axios';

const Map: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);

  // State to store the pixel location
  const [click, setClick] = useState<number[][]>([]);
  const [pointLabels, setPointLabels] = useState<number[]>([]);
  const [activeEvent, setActiveEvent] = useState<'left' | 'right' | null>(null);
  const geogasterRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([0, 0], 5);

      // Add OpenStreetMap basemap
      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      const url_to_geotiff_file =
        'http://oin-hotosm.s3.amazonaws.com/59c66c5223c8440011d7b1e4/0/7ad397c0-bba2-4f98-a08a-931ec3a6e943.tif';

      parseGeoraster(url_to_geotiff_file).then((georaster: any) => {
        console.log('GeoRaster:', georaster);
        geogasterRef.current = georaster;

        // Create the GeoRasterLayer
        const layer = new GeoRasterLayer({
          attribution: 'Planet',
          georaster: georaster,
          resolution: 128, // Adjust resolution for better performance or visual quality
        });

        layer.addTo(mapRef.current);

        // Fit the map to the bounds of the raster layer
        if (mapRef.current) {
          mapRef.current.fitBounds(layer.getBounds());
        }
      }).catch((error: any) => {
        console.error('Error parsing GeoTIFF:', error);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Handle map click event to convert lat/lng to pixel coordinates
    if (!mapRef.current || !geogasterRef.current) return;

    const handleLeftClick = (event: any) => {
      const { lat, lng } = event.latlng;

      // Convert lat/lng to pixel location on the GeoTIFF layer
      const pixel = latLngToPixel(lat, lng, geogasterRef.current);

      // Set pixel coordinates in the state
      setClick((prev) => [...prev, [pixel.x, pixel.y]]);
      setPointLabels((prev) => [...prev, 1]);

      console.log(`Left Pixel location: x = ${pixel.x}, y = ${pixel.y}`);
    };

    const handleRightClick = (event: any) => {
      const { lat, lng } = event.latlng;

      // Convert lat/lng to pixel location on the GeoTIFF layer
      const pixel = latLngToPixel(lat, lng, geogasterRef.current);

      // Set pixel coordinates in the state
      setClick((prev) => [...prev, [pixel.x, pixel.y]]);
      setPointLabels((prev) => [...prev, 0]);

      console.log(`Right-clicked at pixel location: x = ${pixel.x}, y = ${pixel.y}`);
    };

    if (activeEvent === 'left') {
      mapRef.current.on('click', handleLeftClick);
      mapRef.current.on('contextmenu', handleRightClick);
    } else {
      mapRef.current.off('click', handleLeftClick);
      mapRef.current.off('contextmenu', handleRightClick);
    }

    const handleEscape = async (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Reset or disable interactions, for example:
        const data = {
          tif_link: "http://oin-hotosm.s3.amazonaws.com/59c66c5223c8440011d7b1e4/0/7ad397c0-bba2-4f98-a08a-931ec3a6e943.tif",
          point_coords: click,
          point_labels: pointLabels,
        };
        console.log(data);

        try {
          const resp = await axios.post("http://172.25.10.158:5001/process_sam", data)
          console.log(resp.data)
        } catch (error) {
          console.log(error)
        }

        setActiveEvent(null); // Disable event handlers
        setClick([]); // Reset left-click points
        setPointLabels([]); // Reset point labels
        console.log("Escape pressed: Events disabled and data reset");
      }
    };

    // Attach the event listener
    window.addEventListener('keydown', handleEscape);

    return () => {
      if (mapRef.current) {
        window.removeEventListener('keydown', handleEscape);
        mapRef.current.off('contextmenu', handleRightClick);
        mapRef.current.off('click', handleLeftClick);
      }
    };
  }, [activeEvent, click, pointLabels]);

  // Function to convert lat/lng to pixel coordinates on the GeoTIFF image
  const latLngToPixel = (lat: number, lng: number, metadata: any) => {
    const { xmin, ymax, pixelWidth, pixelHeight } = metadata;

    // Step 1: Convert lat/lng to UTM (use Proj4js)
    const utm = proj4('EPSG:4326', 'EPSG:32620', [lng, lat]);

    const utmX = utm[0]; // UTM X (Eastings)
    const utmY = utm[1]; // UTM Y (Northings)

    // Step 2: Calculate pixel X coordinate (horizontal position) using UTM coordinates
    const pixelX = Math.floor((utmX - xmin) / pixelWidth);

    // Step 3: Calculate pixel Y coordinate (vertical position) using UTM coordinates
    const pixelY = Math.floor((ymax - utmY) / pixelHeight);

    return { x: pixelX, y: pixelY };
  };

  return (
    <div>
      {/* Button to toggle map visibility */}
      <div className="absolute top-10 right-10 z-20 bg-white border rounded">
        <button
          className="p-2 m-2 bg-green-500 text-white rounded"
          onClick={() => setActiveEvent('left')}
        >
          Left-click Event
        </button>
        <button
          className="p-2 m-2 bg-gray-500 text-white rounded"
          onClick={() => setActiveEvent(null)}
        >
          Disable Events
        </button>
      </div>

      <div
        id="map"
        className="w-full h-[45rem] md:h-112 lg:h-128 rounded-lg shadow-lg"
        style={{ position: 'relative', zIndex: 1 }} // Ensure map has lower z-index
      />
    </div>
  );
};

export default Map;
