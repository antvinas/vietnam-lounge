import { useState } from 'react';

interface Props {
  images: string[];
}

const SpotGallery = ({ images }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className="h-64 bg-gray-200 rounded-lg" />;
  }

  return (
    <div>
      <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
        <img src={images[activeIndex]} alt="spot" className="h-full w-full object-cover" />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt="thumb"
            onClick={() => setActiveIndex(idx)}
            className={`h-20 w-32 object-cover rounded-md cursor-pointer ${
              idx === activeIndex ? 'ring-2 ring-violet-500' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SpotGallery;