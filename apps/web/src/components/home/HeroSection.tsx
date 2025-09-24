import React from 'react';
import useUiStore from '@/store/ui.store';
import { FaSearch } from 'react-icons/fa';

const HeroSection = () => {
  const { contentMode } = useUiStore();

  const heroConfig = {
    explorer: {
      slogan: 'Explore Vietnam by Day',
      ctaPrimary: '지금 탐험하기',
      ctaSecondary: '커뮤니티 가기',
      searchPlaceholder: '지역, 스팟, 맛집을 검색해보세요...',
      backgroundAsset: '/explorer-hero-video.mp4',
      backgroundType: 'video',
    },
    nightlife: {
      slogan: 'Experience Vietnam After Dark',
      ctaPrimary: '라운지 입장하기',
      ctaSecondary: '커뮤니티 가기',
      searchPlaceholder: '클럽, 바, 유흥 정보를 검색해보세요...',
      backgroundAsset: 'https://images.unsplash.com/photo-1531844229379-b84b5c7f884b?w=1200',
      backgroundType: 'image',
    },
  };

  const current = heroConfig[contentMode];

  return (
    <div className="relative h-[80vh] min-h-[500px] text-white overflow-hidden">
      {/* === Dynamic Background (Video/Image) === */}
      {current.backgroundType === 'video' ? (
        <video
          key={current.backgroundAsset}
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover z-0 filter brightness-90"
        >
          <source src={current.backgroundAsset} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${current.backgroundAsset})` }}
        />
      )}

      {/* === Gradient Overlay for Readability === */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent z-10" />

      {/* === Hero Content === */}
      <div className="relative h-full flex flex-col justify-center items-center text-center p-4 z-20">
        <div className="w-full max-w-2xl flex flex-col items-center">

          <h1 className="text-h1 drop-shadow-lg mb-3">
            Vietnam Lounge
          </h1>
          
          <p className="text-body max-w-xl text-gray-200 drop-shadow-md mb-6">
            {current.slogan}
          </p>

          {/* Search bar with blurred background */}
          <div className="w-full max-w-xl bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-lifted mb-5">
            <div className="relative">
              <input
                type="text"
                placeholder={current.searchPlaceholder}
                className="w-full bg-transparent p-3 pl-6 pr-12 rounded-full text-white placeholder:text-gray-200 focus:outline-none"
              />
              <FaSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-white/80 text-xl" />
            </div>
          </div>

          {/* CTA Buttons with clear hierarchy */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                className="bg-primary hover:opacity-90 text-white font-bold py-3 px-8 rounded-full transition-all duration-240 transform hover:scale-105 shadow-lifted"
              >
                  {current.ctaPrimary}
              </button>
              <button 
                className="bg-transparent border-2 border-white/80 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-full transition-colors duration-240"
              >
                  {current.ctaSecondary}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
