import { useRef, useState } from "react";
import { TileLayer } from "react-leaflet";
import { MAP_TILE_LAYERS } from "../../utils/mapDefaults";

/**
 * Lớp bản đồ chuẩn duy nhất: Google Maps đường phố tiếng Việt,
 * tự chuyển ngầm sang OpenStreetMap.de (không cần API key) nếu kết nối gặp sự cố.
 */
export default function BaseTileLayer() {
  const [fallbackActive, setFallbackActive] = useState(false);
  const errorCountRef = useRef(0);

  const activeKey = fallbackActive ? "osm_de" : "google";
  const layer = MAP_TILE_LAYERS[activeKey];

  return (
    <TileLayer
      key={activeKey}
      url={layer.url}
      {...(layer.subdomains?.length ? { subdomains: layer.subdomains } : {})}
      attribution={layer.attribution}
      maxZoom={20}
      eventHandlers={{
        tileerror: () => {
          if (fallbackActive) return;
          errorCountRef.current += 1;
          if (errorCountRef.current >= 4) {
            setFallbackActive(true);
          }
        },
      }}
    />
  );
}
