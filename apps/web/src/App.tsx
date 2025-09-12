import { useThemeStore } from './store/theme.store';
import { Routes } from './routes';
import AdultGate from './components/common/AdultGate';

function App() {
  const { mode, isGatePassed } = useThemeStore();
  const showGate = mode === 'night' && !isGatePassed;
  const themeClass = mode === 'night' ? 'dark bg-gray-900 text-gray-200' : 'bg-white text-gray-800';

  return (
    <div className={`transition-colors duration-300 min-h-screen ${themeClass}`}>
      {showGate && <AdultGate />}
      <Routes />
    </div>
  );
}

export default App;
