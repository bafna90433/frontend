import React, { useState, useRef, useEffect } from 'react';

interface FAQItem {
  question: string;
  answers: string[];
  note?: string;
  category?: string;
}

const faqData: FAQItem[] = [
  {
    question: "Do you provide GST billing?",
    answers: [
      "Yes, GST invoice is provided with every order.",
      "Input tax credit can be claimed by registered businesses.",
      "If no GST number is available, billing will be done on personal name."
    ],
    category: "Billing"
  },
  {
    question: "When will my order be dispatched?",
    answers: [
      "Orders are dispatched within 24–48 hours of confirmation.",
      "Fast processing directly from our Coimbatore factory.",
      "Tracking details are shared via WhatsApp/SMS after dispatch."
    ],
    category: "Shipping"
  },
  {
    question: "How is the product quality?",
    answers: [
      "Every product undergoes strict quality checks before dispatch.",
      "We use only child-safe, non-toxic materials.",
      "Products are durable, retail-friendly, and built to last.",
      "Consistent quality is maintained across all production batches."
    ],
    category: "Quality"
  },
  {
    question: "Why should retailers buy from us?",
    answers: [
      "Direct manufacturer supply — no middlemen involved.",
      "Better profit margins compared to distributors.",
      "Low MOQ — only 3 pieces per item to get started.",
      "400+ products across multiple categories for wider variety.",
      "Fast-moving, high-demand toys that sell quickly."
    ],
    category: "Business"
  },
  {
    question: "What if I need help or support?",
    answers: [
      "We're always here to help you succeed.",
      "Dedicated WhatsApp support for quick responses.",
      "Quick assistance for orders, queries & complaints.",
      "Smooth coordination from order placement to delivery."
    ],
    category: "Support"
  },
  {
    question: "Who is this platform for?",
    answers: [
      "Exclusively for retailers, resellers & shop owners.",
      "Not designed for single-piece retail customers.",
      "Built specifically for bulk purchasing at wholesale prices."
    ],
    category: "General"
  },
  {
    question: "How is your pricing structured?",
    answers: [
      "Direct manufacturer pricing — best rates guaranteed.",
      "Better margins that help you grow your business.",
      "400+ products to diversify your inventory.",
      "Competitive pricing that helps you match e-commerce rates."
    ],
    category: "Pricing"
  },
  {
    question: "What about damages or returns?",
    answers: [
      "Inspect your order within 24 hours of delivery.",
      "Damaged or wrong items will be taken back — no questions asked.",
      "Returns are accepted only for incorrect or defective products."
    ],
    category: "Returns"
  },
  {
    question: "Can I mix different products in one order?",
    answers: [
      "Yes, absolutely! Mix & match freely.",
      "Order different quantities across categories: Squeezy Toys, Dolls, Rattles, Cars & more.",
      "Customize your order as per your shop's demand and customer preferences."
    ],
    category: "Orders"
  },
  {
    question: "What are the payment options?",
    answers: [
      "Option 1: 100% prepaid online (UPI / Bank Transfer / Card).",
      "Option 2: 30% advance + 70% Cash on Delivery."
    ],
    note: "⚠️ If COD is not accepted at the time of delivery, the 30% advance will be adjusted towards logistics costs incurred.",
    category: "Payments"
  },
  {
    question: "How long does delivery take?",
    answers: [
      "All orders are dispatched from our factory in Coimbatore, Tamil Nadu.",
      "South India: 2–3 business days.",
      "North India: 7–8 business days."
    ],
    category: "Shipping"
  },
  {
    question: "What is the minimum order value?",
    answers: [
      "There is no strict minimum order value — order as per your need.",
      "🚚 Free delivery on orders above ₹3,000.",
      "Orders below ₹3,000 will attract a ₹500 shipping charge.",
      "We recommend ordering ₹3,000+ to save on logistics and maximize margins."
    ],
    category: "Orders"
  },
  {
    question: "What is the minimum order quantity per item?",
    answers: [
      "Only 3 pieces per item for most products.",
      "Perfect for retailers who want to test multiple products with minimal risk."
    ],
    category: "Orders"
  }
];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Billing: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  Shipping: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  Quality: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Business: { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' },
  Support: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  General: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  Pricing: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  Returns: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  Orders: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  Payments: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
};

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    style={{
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
    }}
  >
    <path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '3px' }}>
    <circle cx="8" cy="8" r="8" fill="#F59E0B" opacity="0.15" />
    <path d="M5 8L7 10L11 6" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FAQItemComponent: React.FC<{
  item: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ item, index, isOpen, onToggle }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  const catColor = categoryColors[item.category || 'General'] || categoryColors.General;

  return (
    <div
      style={{
        border: isOpen ? '1px solid #F59E0B' : '1px solid #E5E7EB',
        borderRadius: '14px',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isOpen
          ? '0 8px 25px rgba(245, 158, 11, 0.12), 0 2px 8px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '20px 24px',
          background: isOpen
            ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
            : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAFAFA';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isOpen
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : '#F3F4F6',
            color: isOpen ? '#FFFFFF' : '#6B7280',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
            transition: 'all 0.3s ease',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: isOpen ? '#92400E' : '#1F2937',
              lineHeight: 1.4,
              transition: 'color 0.3s ease',
            }}
          >
            {item.question}
          </span>
          {item.category && (
            <span
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                backgroundColor: catColor.bg,
                color: catColor.text,
                border: `1px solid ${catColor.border}`,
              }}
            >
              {item.category}
            </span>
          )}
        </div>

        <span style={{ color: isOpen ? '#D97706' : '#9CA3AF' }}>
          <ChevronIcon isOpen={isOpen} />
        </span>
      </button>

      <div
        style={{
          maxHeight: `${height}px`,
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div ref={contentRef}>
          <div
            style={{
              padding: '4px 24px 24px',
              paddingLeft: '76px',
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {item.answers.map((answer, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <CheckIcon />
                  <span
                    style={{
                      fontSize: '14.5px',
                      lineHeight: 1.6,
                      color: '#4B5563',
                    }}
                  >
                    {answer}
                  </span>
                </div>
              ))}
            </div>
            {item.note && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  borderLeft: '4px solid #F59E0B',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  color: '#92400E',
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                {item.note}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredData = faqData
    .map((item, originalIndex) => ({ ...item, originalIndex }))
    .filter(
      (item) =>
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answers.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .pro-faq-root {
          min-height: 100vh;
          background: linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 30%, #F9FAFB 100%);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .pro-faq-inner {
          max-width: 820px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .pro-faq-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 50px;
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border: 1px solid #FCD34D;
          font-size: 13px;
          font-weight: 600;
          color: #92400E;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .pro-faq-title {
          font-size: 36px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 12px 0;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .pro-faq-subtitle {
          font-size: 17px;
          color: #6B7280;
          margin: 0 0 36px 0;
          line-height: 1.6;
          max-width: 600px;
        }

        .pro-faq-search-wrap {
          position: relative;
          margin-bottom: 32px;
        }
        .pro-faq-search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          pointer-events: none;
        }
        .pro-faq-search {
          width: 100%;
          padding: 16px 20px 16px 50px;
          border: 2px solid #E5E7EB;
          border-radius: 14px;
          font-size: 15px;
          font-family: inherit;
          background: #FFFFFF;
          color: #1F2937;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .pro-faq-search:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
        }
        .pro-faq-search::placeholder {
          color: #9CA3AF;
        }

        .pro-faq-count {
          font-size: 13px;
          color: #9CA3AF;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .pro-faq-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pro-faq-empty {
          text-align: center;
          padding: 60px 20px;
          color: #9CA3AF;
        }
        .pro-faq-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .pro-faq-empty-text {
          font-size: 16px;
          font-weight: 500;
          color: #6B7280;
          margin-bottom: 4px;
        }
        .pro-faq-empty-sub {
          font-size: 14px;
          color: #9CA3AF;
        }

        .pro-faq-footer {
          margin-top: 48px;
          text-align: center;
          padding: 32px 24px;
          background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
          border-radius: 16px;
          border: 1px solid #FDE68A;
        }
        .pro-faq-footer-title {
          font-size: 18px;
          font-weight: 700;
          color: #92400E;
          margin: 0 0 8px 0;
        }
        .pro-faq-footer-text {
          font-size: 14px;
          color: #B45309;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }
        .pro-faq-footer-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
        }
        .pro-faq-footer-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }

        @media (max-width: 768px) {
          .pro-faq-inner { padding: 40px 16px 60px; }
          .pro-faq-title { font-size: 26px; }
          .pro-faq-subtitle { font-size: 15px; }
        }
      `}</style>

      <div className="pro-faq-root">
        <div className="pro-faq-inner">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="pro-faq-badge">💡 Help Center</span>
            </div>
            <h1 className="pro-faq-title">Frequently Asked Questions</h1>
            <p className="pro-faq-subtitle" style={{ margin: '0 auto' }}>
              Everything you need to know about ordering wholesale toys directly from our factory. Can't find the answer? Reach out to us.
            </p>
          </div>

          {/* Search */}
          <div className="pro-faq-search-wrap">
            <span className="pro-faq-search-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              type="text"
              className="pro-faq-search"
              placeholder="Search questions... e.g. GST, shipping, returns"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOpenIndex(null);
              }}
            />
          </div>

          {/* Count */}
          <div className="pro-faq-count">
            Showing {filteredData.length} of {faqData.length} questions
          </div>

          {/* List */}
          <div className="pro-faq-list">
            {filteredData.length === 0 ? (
              <div className="pro-faq-empty">
                <div className="pro-faq-empty-icon">🔍</div>
                <div className="pro-faq-empty-text">No results found</div>
                <div className="pro-faq-empty-sub">
                  Try a different search term or browse all questions
                </div>
              </div>
            ) : (
              filteredData.map((item, displayIndex) => (
                <FAQItemComponent
                  key={item.originalIndex}
                  item={item}
                  index={item.originalIndex}
                  isOpen={openIndex === item.originalIndex}
                  onToggle={() => toggleFAQ(item.originalIndex)}
                />
              ))
            )}
          </div>

          {/* Footer CTA */}
          <div className="pro-faq-footer">
            <h3 className="pro-faq-footer-title">Still have questions?</h3>
            <p className="pro-faq-footer-text">
              Our team is just a message away. Get instant support on WhatsApp.
            </p>
            <a
              href="https://wa.me/919080114528"
              target="_blank"
              rel="noopener noreferrer"
              className="pro-faq-footer-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;