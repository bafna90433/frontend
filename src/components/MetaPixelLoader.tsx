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
        if (enabled && pixelId) initMetaPixel(pixelId, events);
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
