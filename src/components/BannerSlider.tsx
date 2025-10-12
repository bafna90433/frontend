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
    speed: 600,
    slidesToShow: 3, // ✅ 3 banners ek line me
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    arrows: false,
    pauseOnHover: true,
    cssEase: "ease-in-out",
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 600,
        settings: { slidesToShow: 1 },
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
                  />
                </a>
              ) : (
                <img
                  src={bannerUrl}
                  alt={`Banner ${index + 1}`}
                  className="banner-row-img blur-up"
                  width="500"
                  height="300"
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
