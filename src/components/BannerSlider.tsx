import React, { useEffect, useCallback } from "react";
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
const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

const toInternalPath = (url: string) => {
  try {
    const u = new URL(url);
    return u.pathname + u.search + u.hash;
  } catch {
    return url;
  }
};

const getBannerUrl = (url: string): string => {
  if (!url) return "https://via.placeholder.com/500x300?text=No+Banner";

  // 1. ImageKit Support (Naye uploaded banners)
  if (url.includes("ik.imagekit.io")) {
    const separator = url.includes("?") ? "&" : "?";
    // ImageKit optimization: width 500, format auto, quality 80 for faster mobile load
    return `${url}${separator}tr=w-500,f-auto,q-80`;
  }

  // 2. Cloudinary Support (Purane banners ke liye fallback)
  const transformations = "f_auto,q_auto:eco,w_500,c_fill,g_auto,ar_5:3";

  if (!url.startsWith("http") && cloudName) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${url}`;
  }

  if (url.startsWith("http")) {
    if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
      if (url.includes("/image/upload/f_auto")) return url;
      return url.replace("/image/upload/", `/image/upload/${transformations}/`);
    }
    return url;
  }

  if (url.includes("/uploads/")) return `${API_BASE}${url}`;
  return `${IMAGE_BASE_URL}/uploads/${url}`;
};

const sliderSettings = {
  dots: false,
  speed: 600,
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 4000,
  arrows: false,
  pauseOnHover: true,
  cssEase: "ease-in-out",
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 2 } },
    { breakpoint: 768, settings: { slidesToShow: 1 } },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        centerMode: true,
        centerPadding: "20px",
      },
    },
  ],
};

const BannerSlider: React.FC<Props> = ({ banners, hideFirstBanner = false }) => {
  const navigate = useNavigate();
  const sliderBanners = hideFirstBanner ? banners.slice(1) : banners;

  useEffect(() => {
    const root = document.getElementById("root");
    if (root && !root.classList.contains("app-loaded")) {
        root.classList.add("app-loaded");
    }
  }, []);

  const handleBannerClick = useCallback((e: React.MouseEvent, link: string) => {
    e.preventDefault();
    if (isExternalUrl(link)) {
      window.location.href = link;
    } else {
      navigate(toInternalPath(link));
    }
  }, [navigate]);

  if (sliderBanners.length === 0) return null;

  return (
    <div className="banner-slider-row">
      <Slider {...sliderSettings} infinite={sliderBanners.length > 1}>
        {sliderBanners.map((b, index) => {
          const bannerUrl = getBannerUrl(b.imageUrl);
          const isLcp = !hideFirstBanner && index === 0;

          const ImageTag = (
            <img
              src={bannerUrl}
              alt={`Banner ${index + 1}`}
              className="banner-row-img blur-up"
              width={500}
              height={300}
              loading={isLcp ? "eager" : "lazy"}
              fetchPriority={isLcp ? "high" : "low"}
              decoding={isLcp ? "sync" : "async"}
              onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
            />
          );

          return (
            <div key={index} className="banner-slide">
              <div className="banner-link-wrapper">
                {b.link ? (
                  <a href={b.link} onClick={(e) => handleBannerClick(e, b.link!)} className="banner-link">
                    {ImageTag}
                  </a>
                ) : (
                  ImageTag
                )}
              </div>
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default React.memo(BannerSlider);