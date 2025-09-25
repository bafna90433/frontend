import React, { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/BannerSlider.css';

// 🔑 Env variables
const API_BASE =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:5000';

interface Props {
  banners: string[];
}

const BannerSlider: React.FC<Props> = ({ banners }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    cssEase: 'ease-in-out',
  };

  // ✅ centralized banner URL function
  const getBannerUrl = (url: string): string => {
    if (!url) return 'https://via.placeholder.com/1200x400?text=No+Banner';

    if (url.startsWith('http')) {
      return url;
    } else if (url.includes('/uploads/')) {
      return `${API_BASE}${url}`;
    } else {
      return `${IMAGE_BASE_URL}/uploads/${url.replace(/^\/+/, '')}`;
    }
  };

  return (
    <div className="banner-slider-container">
      <Slider {...settings}>
        {banners.map((url, index) => {
          const bannerUrl = getBannerUrl(url);

          return (
            <div key={index} className="slide-item">
              <img
                src={bannerUrl}
                alt={`Banner ${index + 1}`}
                className="banner-img blur-up"
                width="1200"
                height="400"
                loading={index === 0 ? 'eager' : 'lazy'} // ✅ First image eager
                fetchPriority={index === 0 ? 'high' : 'auto'} // ✅ First banner = high priority
              />
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default BannerSlider;
