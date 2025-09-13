import { Outlet } from 'react-router-dom';
import useThemeStore from '@/store/theme.store';
import AdultGate from '@/components/common/AdultGate';
import Header from '@/components/layout/Header';

function App() {
  const { mode, isGatePassed, passGate } = useThemeStore();
  const showGate = mode === 'night' && !isGatePassed;
  const themeClass = mode === 'night' ? 'dark bg-gray-900 text-gray-200' : 'bg-white text-gray-800';

  return (
    <div className={`transition-colors duration-300 min-h-screen ${themeClass}`}>
      {showGate ? (
        <AdultGate onEnter={passGate} />
      ) : (
        <>
          <Header />
          <main className="pt-16">
            <Outlet />
          </main>
        </>
      )}
    </div>
  );
}

export default App;
