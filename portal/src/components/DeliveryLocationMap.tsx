import React, { useState } from 'react';
import { MapContainer,useMap, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LeafletMouseEvent } from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon paths
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const defaultIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
interface DeliveryLocationMapProps {
  location: { lat: number; lng: number } | null;
  setLocation: (loc: { lat: number; lng: number }) => void;
  userLocation: { lat: number; lng: number } | null;
}

interface LocationMarkerProps {
  setLocation: (loc: { lat: number; lng: number }) => void;
  location: { lat: number; lng: number } | null;
  userLocation: { lat: number; lng: number } | null;
}

function LocationMarker({ setLocation, location, userLocation, recenter, setRecenter }: LocationMarkerProps & { userLocation: { lat: number; lng: number } | null, recenter: boolean, setRecenter: React.Dispatch<React.SetStateAction<boolean>> }) {
  console.log(location, userLocation);
  const map = useMap();
  React.useEffect(() => {
    if (recenter && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
      setLocation(userLocation);
      setRecenter(false);
    }
  }, [recenter, userLocation, map, setLocation, setRecenter]);
  useMapEvents({
    click(e: LeafletMouseEvent) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  // Show marker at selected location if set, otherwise at userLocation
  const markerPosition = location || userLocation;
  return markerPosition ? <Marker position={markerPosition} icon={defaultIcon} /> : null;
}

const DeliveryLocationMap: React.FC<DeliveryLocationMapProps> = ({ location, setLocation, userLocation }) => {
  // const mapRef = useRef<LeafletMap | null>(null);
  const [recenter, setRecenter] = useState(false);

  return (
  <div className="h-64 w-full rounded-lg overflow-hidden border z-50 border-gray-300 relative">
      <MapContainer
     
        center={
          location
            ? [location.lat, location.lng]
            : userLocation
            ? [userLocation.lat, userLocation.lng]
            : [9.0054, 38.7636]
        }
        zoom={13}
        style={{ height: '100%', width: '100%' }}
  //      whenReady={(event) => {
  //   mapRef.current = event.target; // this is the Leaflet map instance
  // }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
      <LocationMarker setLocation={setLocation} location={location} userLocation={userLocation} recenter={recenter} setRecenter={setRecenter} />
      </MapContainer>
      {userLocation && (
        <button
          className="absolute top-2 right-2 bg-white text-gray-700 dark:text-gray-300 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1 text-sm font-semibold shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-all z-50"
          onClick={() => setRecenter(true)}
           style={{ zIndex: 1000 }}
        >
          Recenter to My Location
        </button>
      )}
      {location && (
        <p className="absolute bottom-2 left-2 bg-white dark:bg-gray-800 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-300 shadow"
         style={{ zIndex: 1000 }}
        >
          Selected: Lat {location.lat.toFixed(5)}, Lng {location.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default DeliveryLocationMap;
