import React from 'react';
import useUiStore from '@/store/ui.store';
import HeroSection from '@/components/home/HeroSection';
import FeaturedSpots from '@/components/home/FeaturedSpots';
import CommunityHighlights from '@/components/home/CommunityHighlights';
import UpcomingEvents from '@/components/home/UpcomingEvents';
import ModeSpecificBanner from '@/components/home/ModeSpecificBanner';

const Home = () => {
  const { contentMode } = useUiStore();

  // Mock data - will be replaced with API calls
  const mockSpots = {
    explorer: [
      { id: 1, name: '하롱베이 크루즈', tags: ['#풍경', '#투어'], rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1559592413-716d396452d9?w=800' },
      { id: 2, name: '호이안 올드타운', tags: ['#역사', '#문화'], rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1575964894391-a1cf47d5d970?w=800' },
      { id: 3, name: '콩카페 코코넛 커피', tags: ['#카페', '#인기'], rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1557898284-c5a21a5a0d36?w=800' },
      { id: 4, name: '다낭 비치', tags: ['#해변', '#휴양'], rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1607469719423-9a3d4729146d?w=800' },
    ],
    nightlife: [
      { id: 1, name: 'Apocalypse Now Bar', tags: ['#클럽', '#호치민'], rating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1582227866385-95240220a597?w=800' },
      { id: 2, name: 'Sky36 Bar', tags: ['#루프탑', '#다낭'], rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1543336497-a2e633005ab8?w=800' },
      { id: 3, name: 'Lush Saigon', tags: ['#라운지', '#인기'], rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800' },
      { id: 4, name: 'Golden Lotus Spa', tags: ['#마사지', '#힐링'], rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1600334089648-b393b3848b13?w=800' },
    ]
  };

  const mockCommunityPosts = [
    { id: 1, title: '호치민 1군 클럽 후기입니다!!', author: '라운지매니아', avatarUrl: '/path/to/avatar1.png' },
    { id: 2, title: '다낭 여행 같이 하실 분?', author: '여행중독', avatarUrl: '/path/to/avatar2.png' },
    { id: 3, title: '하노이 맥주거리에서 치맥하실 분!', author: '맥주킬러', avatarUrl: '/path/to/avatar3.png' },
  ];

  const mockEvents = [
    { id: 1, name: '하노이 뮤직 페스티벌', date: '2024-09-15', location: 'My Dinh Stadium', imageUrl: 'https://images.unsplash.com/photo-1563848758622-3c4c4e745677?w=800' },
    { id: 2, name: '다낭 국제 불꽃 축제', date: '2024-10-20', location: 'Han River Port', imageUrl: 'https://images.unsplash.com/photo-1574510079432-6a7e3c35b54a?w=800' },
  ];

  return (
    <div className="space-y-16 pb-16">
      <HeroSection />
      <div className="container mx-auto px-4 space-y-20">
        <FeaturedSpots spots={contentMode === 'nightlife' ? mockSpots.nightlife : mockSpots.explorer} />
        <CommunityHighlights posts={mockCommunityPosts} />
        <UpcomingEvents events={mockEvents} />
        <ModeSpecificBanner />
      </div>
    </div>
  );
};

export default Home;
