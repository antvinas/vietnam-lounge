import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import { useThemeStore } from '../../store/theme.store';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { mode } = useThemeStore();
  const isNight = mode === 'night';
  const linkColor = isNight ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-blue-500';

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          
          <div className="md:col-span-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Vietnam Lounge</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your ultimate guide to the best of Vietnam, day and night.</p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link to="/" className={linkColor}>Home</Link></li>
              <li><Link to="/spots" className={linkColor}>Spots</Link></li>
              <li><Link to="/plan" className={linkColor}>Plan</Link></li>
              <li><Link to="/community" className={linkColor}>Community</Link></li>
              <li><Link to="/events" className={linkColor}>Events</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className={linkColor}>Terms of Service</Link></li>
              <li><Link to="/privacy" className={linkColor}>Privacy Policy</Link></li>
              <li><Link to="/contact" className={linkColor}>Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Follow Us</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"><FaFacebook size={24} /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-500 dark:hover:text-pink-400"><FaInstagram size={24} /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-sky-500 dark:hover:text-sky-400"><FaTwitter size={24} /></a>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
          <p>&copy; {currentYear} Vietnam Lounge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
