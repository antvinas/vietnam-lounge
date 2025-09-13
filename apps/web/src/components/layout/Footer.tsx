import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import useThemeStore from '../../store/theme.store';

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
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">베트남 라운지</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">최고의 베트남을 경험하기 위한 최고의 가이드, 밤낮으로.</p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">탐색</h3>
            <ul className="space-y-2">
              <li><Link to="/" className={linkColor}>홈</Link></li>
              <li><Link to="/spots" className={linkColor}>스팟</Link></li>
              <li><Link to="/plan" className={linkColor}>일정짜기</Link></li>
              <li><Link to="/community" className={linkColor}>커뮤니티</Link></li>
              <li><Link to="/events" className={linkColor}>이벤트</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">법률</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className={linkColor}>이용약관</Link></li>
              <li><Link to="/privacy" className={linkColor}>개인정보 처리방침</Link></li>
              <li><Link to="/contact" className={linkColor}>문의하기</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">팔로우하기</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"><FaFacebook size={24} /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-500 dark:hover:text-pink-400"><FaInstagram size={24} /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-sky-500 dark:hover:text-sky-400"><FaTwitter size={24} /></a>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
          <p>&copy; {currentYear} 베트남 라운지. 모든 권리 보유.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
