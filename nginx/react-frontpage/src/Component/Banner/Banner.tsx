import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper'; 
import 'swiper/css';

const Banner: React.FC = () => {
  const slides = [
    {
      id: 1,
      image: '/images/CCBanner/b1.png',
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(1); 

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '7 / 1' }}>
      <Swiper
        onSlideChange={(swiper: SwiperType) => setCurrentIndex(swiper.activeIndex + 1)} 
        loop={false} 
        className="h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <img
              src={slide.image}
              className="w-full h-full object-cover"
              alt={`Slide ${slide.id}`}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Banner;
