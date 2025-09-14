import React from 'react';
import useUiStore from '@/store/ui.store';
import { FaSun, FaMoon, FaArrowRight } from 'react-icons/fa';

const ModeSpecificBanner = () => {
  const { contentMode } = useUiStore();

  // Banner configuration is updated with the new, more evocative copy.
  const bannerContent = {
    explorer: {
      icon: <FaSun className="text-accent" />,
      title: '당신의 모험이 시작됩니다.',
      description: '햇살 가득한 시장과 고대 사원, 그리고 숨 막히는 풍경까지.',
      cta: '추천 스팟 보기',
    },
    nightlife: {
      icon: <FaMoon className="text-accent" />,
      title: '밤의 라운지를 즐겨보세요 🌙',
      description: '네온 불빛 아래, 클럽·바·라운지에서 또 다른 매력을 발견하세요.',
      cta: '핫 플레이스 보기',
    },
  };

  const current = bannerContent[contentMode];

  return (
    <section 
      className={`rounded-2xl p-8 shadow-lifted transition-all duration-320 bg-surface`}
    >
      <div className="flex flex-col items-center justify-between md:flex-row gap-6 md:gap-8">
        
        <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
            <div className="flex-shrink-0 text-3xl md:text-4xl">
              {current.icon}
            </div>
            <div>
                <h3 className="text-h2 text-text-main">
                    {current.title}
                </h3>
                <p className="mt-2 max-w-lg text-text-secondary text-body">
                    {current.description}
                </p>
            </div>
        </div>

        <div className="mt-4 md:mt-0 flex-shrink-0">
            <button 
              className={`bg-primary hover:opacity-90 text-white font-bold py-3 px-6 rounded-full transition-all duration-240 transform hover:scale-105 shadow-lifted flex items-center justify-center`}>
                {current.cta} <FaArrowRight className="ml-2 text-sm" />
            </button>
        </div>

      </div>
    </section>
  );
};

export default ModeSpecificBanner;
