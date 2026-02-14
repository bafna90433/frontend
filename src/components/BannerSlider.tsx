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
    infinite: false, // ✅ LCP fix (avoid slick clones)
    speed: 800,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    pauseOnHover: true,
    cssEase: "ease-in-out",
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, speed: 600 } },
      { breakpoint: 768, settings: { slidesToShow: 1, speed: 500 } },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          speed: 400,
          centerMode: true,
          centerPadding: "20px",
        },
      },
    ],
  };

  const getBannerUrl = (url: string): string => {
    if (!url) return "https://via.placeholder.com/500x300?text=No+Banner";

    // ✅ Cloudinary public id -> optimize
    if (!url.startsWith("http") && cloudName) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1000,c_limit/${url}`;
    }

    // ✅ Absolute URL
    if (url.startsWith("http")) {
      // If Cloudinary URL, inject optimization
      if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
        if (url.includes("/image/upload/f_auto")) return url;
        return url.replace(
          "/image/upload/",
          "/image/upload/f_auto,q_auto,w_1000,c_limit/"
        );
      }
      return url;
    }

    // ✅ Your server uploads
    if (url.includes("/uploads/")) return `${API_BASE}${url}`;
    return `${IMAGE_BASE_URL}/uploads/${url}`;
  };

  const getImgProps = (index: number): Record<string, any> => {
    const isLCP = index === 0; // ✅ first banner is LCP
    return {
      width: 500,
      height: 300,
      loading: isLCP ? "eager" : "lazy",
      fetchpriority: isLCP ? "high" : "auto", // ✅ correct attribute (lowercase)
      decoding: "async",
    };
  };

  return (
    <div className="banner-slider-row">
      <Slider {...settings}>
        {banners.map((b, index) => {
          const bannerUrl = getBannerUrl(b.imageUrl);
          const imgProps = getImgProps(index);

          const Img = (
            <img
              src={bannerUrl}
              alt={`Banner ${index + 1}`}
              className="banner-row-img blur-up"
              onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
              {...imgProps}
            />
          );

          return (
            <div key={index} className="banner-slide">
              {b.link ? (
                <a
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner-link"
                >
                  {Img}
                </a>
              ) : (
                Img
              )}
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default BannerSlider;
