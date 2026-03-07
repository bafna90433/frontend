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

const BannerSlider: React.FC<Props> = ({ banners, hideFirstBanner = false }) => {
  const navigate = useNavigate();
  const sliderBanners = hideFirstBanner ? banners.slice(1) : banners;

  useEffect(() => {
    document.getElementById("root")?.classList.add("app-loaded");
  }, []);

  const settings = {
    dots: false,
    infinite: sliderBanners.length > 1,
    speed: 800,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
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
          centerPadding: "25px",
        },
      },
    ],
  };

  const getBannerUrl = (url: string): string => {
    if (!url) return "https://via.placeholder.com/500x200?text=No+Banner";

    // ✅ ULTRA SHARP: 1500px width for 500px display (3x Density)
    // ✅ AUTO-FILL: Ar_5:3 ensures no stretching
    const transformations = "f_auto,q_auto:best,w_1500,h_900,c_fill,g_auto,ar_5:3,dpr_auto";

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

  const handleBannerClick = (e: React.MouseEvent, link: string) => {
    e.preventDefault();
    if (isExternalUrl(link)) {
      window.location.href = link;
    } else {
      navigate(toInternalPath(link));
    }
  };

  if (sliderBanners.length === 0) return null;

  return (
    <div className="banner-slider-row">
      <Slider {...settings}>
        {sliderBanners.map((b, index) => {
          const bannerUrl = getBannerUrl(b.imageUrl);
          const isLcp = !hideFirstBanner && index < 3;

          return (
            <div key={index} className="banner-slide">
              <div className="banner-link-wrapper">
                {b.link ? (
                  <a href={b.link} onClick={(e) => handleBannerClick(e, b.link!)} className="banner-link">
                    <img
                      src={bannerUrl}
                      alt={`Banner ${index + 1}`}
                      className="banner-row-img blur-up"
                      width={500}
                      height={300}
                      loading={isLcp ? "eager" : "lazy"}
                      fetchPriority={isLcp ? "high" : "auto"}
                      onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                      ref={(img) => { if (img?.complete) img.classList.add("is-loaded"); }}
                    />
                  </a>
                ) : (
                  <img
                    src={bannerUrl}
                    alt={`Banner ${index + 1}`}
                    className="banner-row-img blur-up"
                    width={500}
                    height={300}
                    loading={isLcp ? "eager" : "lazy"}
                    onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                    ref={(img) => { if (img?.complete) img.classList.add("is-loaded"); }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default BannerSlider;