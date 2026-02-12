import React, { useMemo, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../styles/PopularCategories.css";

type Category = {
  _id: string;
  name: string;
  image?: string;
  imageUrl?: string;
};

// Updated Props to accept Title & Subtitle from Home.tsx
interface Props {
  categories: Category[];
  title?: string;
  subtitle?: string;
}

const getCatImage = (c: Category) => c.image || c.imageUrl || "";

const PopularCategories: React.FC<Props> = ({ categories, title, subtitle }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  
  if (!list || list.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -width / 1.5 : width / 1.5,
      behavior: "smooth",
    });
  };

  return (
    <section className="pc-section">
      <div className="pc-heading">
        <h2>{title || "Popular Categories"}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="pc-slider-container">
        {/* Left Arrow */}
        <button className="pc-arrow pc-arrow-left" onClick={() => scroll("left")} type="button">
          <FiChevronLeft />
        </button>

        {/* The Big Cyan Pill */}
        <div className="pc-pill">
          <div className="pc-slider" ref={scrollRef}>
            {list.map((cat) => (
              <div key={cat._id} className="pc-item">
                <div className="pc-circle">
                  {getCatImage(cat) ? (
                    <img src={getCatImage(cat)} alt={cat.name} />
                  ) : (
                    <div className="pc-noimg">No Img</div>
                  )}
                </div>
                <span className="pc-name">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button className="pc-arrow pc-arrow-right" onClick={() => scroll("right")} type="button">
          <FiChevronRight />
        </button>
      </div>
    </section>
  );
};

export default PopularCategories;