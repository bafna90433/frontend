import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axiosConfig";
import { initMetaPixel, trackPageView } from "../utils/metaPixel";

const MetaPixelLoader: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/settings/meta-pixel");
        const { pixelId, enabled, events } = res.data || {};
        
        if (enabled && pixelId) {
          // Manual Advanced Matching data
          let userData: Record<string, string> = {};
          const userStr = localStorage.getItem("user");
          
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              // Format data for FB Pixel (lowercased, digits only for phone)
              if (user.email) userData.em = user.email.toLowerCase().trim();
              if (user.otpMobile) userData.ph = user.otpMobile.replace(/\D/g, "");
              if (user.fullName) {
                const parts = user.fullName.trim().split(" ");
                userData.fn = parts[0].toLowerCase();
                if (parts.length > 1) userData.ln = parts[parts.length - 1].toLowerCase();
              }
            } catch (e) {
              console.error("Error parsing user for Pixel", e);
            }
          }

          initMetaPixel(pixelId, events, userData);
        }
      } catch {
        // silent — pixel is optional
      }
    })();
  }, []);

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return null;
};

export default MetaPixelLoader;

