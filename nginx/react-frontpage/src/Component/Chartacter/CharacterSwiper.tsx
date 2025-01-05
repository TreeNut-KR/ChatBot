'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
const RepeatingSwiper: React.FC = () => {
  const slides = [
    { id: 1, src: '/images/CCSwiper/1.png', name: '미래에서 딸이 찾아옴', description: '"아빠. 이대로라면, 아빠는 15년 뒤에 살해 당해서 죽어." 본격 달콤 살벌 SF 추리 로맨스. ✅슈모 필수 ✅히로인 1명 스토커 1명 딸 1명 ✅이미지 27장' },
    { id: 2, src: '/images/CCSwiper/2.png', name: '이나리', description: '내가 모시는 까칠한 여우신' },
    { id: 3, src: '/images/CCSwiper/3.png', name: '진서연', description: '평생의 소원이었어. 내 손으로 널 부숴 버리는 거.' },
    { id: 4, src: '/images/CCSwiper/4.png', name: '초능력 학교', description: '초능력자들을 위한 학교. 다양한 초능력을 지닌 개성 넘치는 학생들을 만나보자. [초능력 시리즈] 수정 내역 - 김서연 이미지 교체 - 설아 이미지 교체' },
    { id: 5, src: '/images/CCSwiper/5.png', name: '이유리', description: '나를 오랫동안 짝사랑했던 여사친 "나랑 눈싸움 하자!"' },
  ];

  const turncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <div className='W-full flex flex-col gap-16 pt-16 pb-16'>
    <div className="w-full box-border flex flex-col gap-5">
      <div className="text-left">
        <p className="text-[18px] font-bold text-white-600">최근 대화한 캐릭터와 대화 하세요</p>
      </div>
      <div className="w-full">
        <Swiper 
        spaceBetween={12} 
        slidesPerView={4.5} 
        loop={true} 
        className="max-height-[280px] box-border">
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className="flex flex-col justify-center items-center box-border">
              <div className="flex flex-col gap-3">
                <div className="flex justify-center items-center w-[155px] h-[155px] box-border">
                  <img
                    src={slide.src}
                    alt={slide.name}
                    className="w-full h-full object-cover border border-gray-300 box-border rounded-xl"
                  />
                </div>
                <div className="flex flex-col w-fit text-left gap-2">
                  <p className="text-[16px] leading-[100%] font-semibold box-border whitespace-nowrap">
                    {slide.name}
                  </p>
                  <p className="text-[14px] text-[#a8a69d] font-medium box-border">
                    {turncateText(slide.description, 30)}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  </div>
  );
};

export default RepeatingSwiper;
