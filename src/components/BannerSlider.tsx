import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/BannerSlider.css';

// 🔑 Env variables
const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

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
    if (!url) return "https://via.placeholder.com/1200x400?text=No+Banner";

    if (url.startsWith("http")) {
      return url;
    } else if (url.includes("/uploads/")) {
      return `${API_BASE}${url}`;
    } else {
      return `${IMAGE_BASE_URL}/uploads/${url.replace(/^\/+/, "")}`;
    }
  };

  return (
    <div className="banner-slider-container">
      <Slider {...settings}>
        {banners.map((url, index) => (
          <div key={index} className="slide-item">
            <img
              src={getBannerUrl(url)}
              alt={`Banner ${index + 1}`}
              className="banner-img"
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default BannerSlider;
