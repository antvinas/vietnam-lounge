
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/theme.store';

const ADULT_GATE_VERIFIED_KEY = 'adult_gate_verified';

const AdultGate = ({ onEnter }: { onEnter: () => void }) => {
  const [isVerified, setVerified] = useState(false);
  const navigate = useNavigate();

  const { mode } = useThemeStore();
  const isNight = mode === 'night';

  useEffect(() => {
    const isAlreadyVerified = localStorage.getItem(ADULT_GATE_VERIFIED_KEY) === 'true';
    if (isAlreadyVerified) {
      setVerified(true);
      onEnter();
    }
  }, [onEnter]);

  const handleEnter = () => {
    localStorage.setItem(ADULT_GATE_VERIFIED_KEY, 'true');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    localStorage.setItem('adult_gate_expiry', expiryDate.toISOString());

    setVerified(true);
    onEnter();
  };

  const handleLeave = useCallback(() => {
    navigate(-1); 
  }, [navigate]);

  useEffect(() => {
    if (isVerified) return;
    
    const timer = setTimeout(() => {
        if(!isVerified) {
            handleLeave();
        }
    }, 10000); // Auto-redirect after 10 seconds

    return () => clearTimeout(timer);
  }, [isVerified, handleLeave]);

  if (isVerified) return null;

  const bgColor = isNight ? 'bg-gray-900' : 'bg-gray-100';
  const textColor = isNight ? 'text-white' : 'text-gray-800';
  const buttonStyles = `px-8 py-3 text-lg font-bold rounded-lg transition-transform transform hover:scale-105`;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${bgColor} ${textColor}`}>
      <div className="text-center p-8 max-w-lg">
        <h1 className="text-4xl font-extrabold mb-4">Age Verification</h1>
        <p className="text-lg mb-8">This section may contain adult content. Please confirm you are of legal age to view this content in your region.</p>
        <div className="flex justify-center gap-6">
          <button 
            onClick={handleEnter} 
            className={`${buttonStyles} bg-green-600 hover:bg-green-700 text-white`}
          >
            Enter
          </button>
          <button 
            onClick={handleLeave} 
            className={`${buttonStyles} bg-red-600 hover:bg-red-700 text-white`}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdultGate;
