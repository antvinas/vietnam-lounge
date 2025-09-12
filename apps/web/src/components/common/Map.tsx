import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useMemo } from 'react';

const containerStyle = {
  width: '100%',
  height: '400px'
};

interface MapProps {
  lat: number;
  lng: number;
  zoom?: number;
}

const Map = ({ lat, lng, zoom = 15 }: MapProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const center = useMemo(() => ({
    lat,
    lng
  }), [lat, lng]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading Maps...</div>;
  }

  return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
  );
}

export default Map;
