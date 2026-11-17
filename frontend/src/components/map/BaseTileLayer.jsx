import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { TileLayer } from "react-leaflet";
import { MAP_TILE_LAYERS } from "../../utils/mapDefaults";

/**
 * Lớp bản đồ dùng chung: mặc định Google Maps đường phố tiếng Việt,
 * tự chuyển sang Carto Voyager nếu kết nối gặp sự cố lặp lại.
 */
export default function BaseTileLayer({ layerKey = "google" }) {
  const [fallbackActive, setFallbackActive] = useState(false);
  const errorCountRef = useRef(0);

  useEffect(() => {
    setFallbackActive(false);
    errorCountRef.current = 0;
  }, [layerKey]);

  const activeKey = fallbackActive ? "carto" : layerKey;
  const layer = MAP_TILE_LAYERS[activeKey] || MAP_TILE_LAYERS.google;

  return (
    <TileLayer
      key={activeKey}
      url={layer.url}
      subdomains={layer.subdomains}
      attribution={layer.attribution}
      maxZoom={20}
      eventHandlers={{
        tileerror: () => {
          if (fallbackActive || activeKey === "carto") return;
          errorCountRef.current += 1;
          if (errorCountRef.current >= 4) {
            setFallbackActive(true);
          }
        },
      }}
    />
  );
}

BaseTileLayer.propTypes = {
  layerKey: PropTypes.oneOf(["google", "carto"]),
};
