import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/BannerSlider.css';
import { getImageUrl } from '../utils/image';

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
        {banners.map((url, index) => (
          <div key={index} className="slide-item">
            <img
              src={getImageUrl(url)}
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
