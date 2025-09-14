import { Outlet } from 'react-router-dom';
import useUiStore from '@/store/ui.store';
import AdultGate from '@/components/common/AdultGate';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useEffect } from 'react';

function App() {
  const { contentMode, themeMode, isGatePassed, setContentMode, passGate } = useUiStore();

  // This single, consolidated effect handles all theme and mode changes.
  useEffect(() => {
    const root = document.documentElement;

    // 1. Set Dark/Light mode class
    root.classList.toggle('dark', themeMode === 'dark');

    // 2. Set Content mode data-attribute for CSS variables
    root.setAttribute('data-content-mode', contentMode);

  }, [themeMode, contentMode]);

  // This acts as a hard gate if the user tries to access nightlife content directly
  // without having passed the age verification in the session.
  const showGate = contentMode === 'nightlife' && !isGatePassed;

  const handleGateSuccess = () => {
    passGate();
  };
  
  const handleGateCancel = () => {
    // If the hard gate is shown and the user cancels,
    // revert to the safe 'explorer' mode.
    setContentMode('explorer');
  };

  return (
    // The main div no longer needs explicit color classes (`bg-white`, `dark:bg-gray-900`, etc.).
    // This is now handled by the `body` tag style in `index.css` via our new theme variables.
    <div className="flex flex-col min-h-screen">
      {showGate ? (
        <AdultGate onSuccess={handleGateSuccess} onCancel={handleGateCancel} />
      ) : (
        <>
          <Header />
          {/* The `pt-16` is important to prevent content from being hidden by the sticky header. */}
          <main className="flex-grow pt-16">
            <Outlet />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
