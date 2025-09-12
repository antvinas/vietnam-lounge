import { FaExclamationTriangle } from 'react-icons/fa';

interface Spot {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface MapViewProps {
  spots: Spot[];
}

const MapView = ({ spots }: MapViewProps) => {
  // Google Maps Integration would be here. 
  // This requires setting up the Google Maps JavaScript API, 
  // which involves obtaining an API key and setting up a billing account.
  
  return (
    <div 
      className="w-full h-[600px] bg-gray-200 dark:bg-gray-700 rounded-lg flex justify-center items-center text-center p-4"
    >
      <div>
        <FaExclamationTriangle className="text-5xl text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Map View Not Available</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Google Maps integration is required to display the map. This is a placeholder.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          (Number of spots to display: {spots.length})
        </p>
      </div>
    </div>
  );
};

export default MapView;