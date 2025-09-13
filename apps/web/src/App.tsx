import useThemeStore from './store/theme.store';
import { Routes } from './routes';
import AdultGate from './components/common/AdultGate';
import Shell from './components/layout/Shell';

function App() {
  const { mode, isGatePassed, passGate } = useThemeStore();
  const showGate = mode === 'night' && !isGatePassed;
  const themeClass = mode === 'night' ? 'dark bg-gray-900 text-gray-200' : 'bg-white text-gray-800';

  return (
    <div className={`transition-colors duration-300 min-h-screen ${themeClass}`}>
      {showGate && <AdultGate onEnter={passGate} />}
      <Shell>
        <Routes />
      </Shell>
    </div>
  );
}

export default App;
