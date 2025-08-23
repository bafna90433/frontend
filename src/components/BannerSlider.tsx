import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/BannerSlider.css';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL as string;

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

  return (
    <div className="banner-slider-container">
      <Slider {...settings}>
        {banners.map((url, index) => {
          // ✅ If backend sends just "banners/file.png"
          const cleanPath = url.replace(/^\/+/, '');
          const imageSrc = url.startsWith("http")
            ? url
            : `${IMAGE_BASE_URL}/uploads/${cleanPath}`;

          return (
            <div key={index} className="slide-item">
              <img
                src={imageSrc}
                alt={`Banner ${index + 1}`}
                className="banner-img"
              />
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default BannerSlider;
