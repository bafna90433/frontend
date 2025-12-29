import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/BannerSlider.css";

interface Banner {
  imageUrl: string;
  link?: string;
}

interface Props {
  banners: Banner[];
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const BannerSlider: React.FC<Props> = ({ banners }) => {
  const settings = {
    dots: false,
    infinite: true,
    speed: 800,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000, // ✅ 3 seconds timing
    arrows: false,
    pauseOnHover: true,
    cssEase: "ease-in-out",
    responsive: [
      {
        breakpoint: 1024,
        settings: { 
          slidesToShow: 2,
          speed: 600
        },
      },
      {
        breakpoint: 768,
        settings: { 
          slidesToShow: 1,
          speed: 500
        },
      },
      {
        breakpoint: 480,
        settings: { 
          slidesToShow: 1,
          speed: 400,
          centerMode: true,
          centerPadding: "20px"
        },
      },
    ],
  };

  const getBannerUrl = (url: string): string => {
    if (!url) return "https://via.placeholder.com/500x300?text=No+Banner";
    if (url.startsWith("http")) return url;
    if (url.includes("/uploads/")) return `${API_BASE}${url}`;
    if (cloudName)
      return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
    return `${IMAGE_BASE_URL}/uploads/${url}`;
  };

  return (
    <div className="banner-slider-row">
      <Slider {...settings}>
        {banners.map((b, index) => {
          const bannerUrl = getBannerUrl(b.imageUrl);
          return (
            <div key={index} className="banner-slide">
              {b.link ? (
                <a
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner-link"
                >
                  <img
                    src={bannerUrl}
                    alt={`Banner ${index + 1}`}
                    className="banner-row-img blur-up"
                    width="500"
                    height="300"
                    loading="lazy"
                  />
                </a>
              ) : (
                <img
                  src={bannerUrl}
                  alt={`Banner ${index + 1}`}
                  className="banner-row-img blur-up"
                  width="500"
                  height="300"
                  loading="lazy"
                />
              )}
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default BannerSlider;