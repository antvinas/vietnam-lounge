import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';

const AdultShell = () => {
  return (
    <div className="flex flex-col min-h-screen">
        <Helmet>
            <title>Nightlife</title>
            <meta name="robots" content="noindex, nofollow" />
        </Helmet>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AdultShell;
