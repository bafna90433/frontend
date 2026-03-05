import React, { useEffect } from "react";
import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/BannerSlider.css";

interface Banner {
  imageUrl: string;
  link?: string;
}

interface Props {
  banners: Banner[];
  hideFirstBanner?: boolean;
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

const toInternalPath = (url: string) => {
  // If full URL given, convert to path (works for same-domain links too)
  try {
    const u = new URL(url);
    return u.pathname + u.search + u.hash;
  } catch {
    return url; // already relative like /products?category=...
  }
};

const BannerSlider: React.FC<Props> = ({ banners, hideFirstBanner = false }) => {
  const navigate = useNavigate();

  const sliderBanners = hideFirstBanner ? banners.slice(1) : banners;

  useEffect(() => {
    document.getElementById("root")?.classList.add("app-loaded");
  }, []);

  const settings = {
    dots: false,
    infinite: false,
    speed: 800,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    pauseOnHover: true,
    cssEase: "ease-in-out",
    lazyLoad: "ondemand" as const,
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
    if (!url) return "https://via.placeholder.com/600x360?text=No+Banner";

    if (!url.startsWith("http") && cloudName) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_600,c_limit/${url}`;
    }

    if (url.startsWith("http")) {
      if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
        if (url.includes("/image/upload/f_auto")) return url;
        return url.replace(
          "/image/upload/",
          "/image/upload/f_auto,q_auto,w_600,c_limit/"
        );
      }
      return url;
    }

    if (url.includes("/uploads/")) return `${API_BASE}${url}`;
    return `${IMAGE_BASE_URL}/uploads/${url}`;
  };

  const getImgProps = (index: number): Record<string, any> => {
    const isLcp = !hideFirstBanner && index < 3;
    return {
      width: 600,
      height: 360,
      loading: isLcp ? "eager" : "lazy",
      fetchPriority: isLcp ? "high" : "auto",
      decoding: isLcp ? "sync" : "async",
    };
  };

  const handleBannerClick = (e: React.MouseEvent, link: string) => {
    e.preventDefault();
    e.stopPropagation();

    // External -> same tab
    if (isExternalUrl(link)) {
      window.location.href = link;
      return;
    }

    // Internal -> SPA same tab (no reload)
    navigate(toInternalPath(link));
  };

  if (sliderBanners.length === 0) return null;

  return (
    <div className="banner-slider-row">
      <Slider {...settings}>
        {sliderBanners.map((b, index) => {
          const bannerUrl = getBannerUrl(b.imageUrl);
          const imgProps = getImgProps(index);

          const Img = (
            <img
              src={bannerUrl}
              alt={`Banner ${hideFirstBanner ? index + 2 : index + 1}`}
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
                  onClick={(e) => handleBannerClick(e, b.link!)}
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