import PropTypes from "prop-types";
import { MAP_TILE_LAYERS } from "../../utils/mapDefaults";

/** Nút chuyển đổi giữa lớp Google Maps Đường phố và Bản đồ sáng Carto. */
export default function MapLayerToggle({ value, onChange, className = "" }) {
  return (
    <div
      className={`inline-flex rounded-lg bg-white/95 border border-gray-200 shadow-sm p-0.5 text-xs font-semibold ${className}`}
    >
      {Object.values(MAP_TILE_LAYERS).map((layer) => {
        const active = value === layer.id;
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => onChange(layer.id)}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              active
                ? "bg-[#174D2C] text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {layer.label}
          </button>
        );
      })}
    </div>
  );
}

MapLayerToggle.propTypes = {
  value: PropTypes.oneOf(["google", "carto"]).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
