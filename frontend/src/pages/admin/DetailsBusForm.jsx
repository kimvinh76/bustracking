import { formatDateTimeVi } from "../../utils/dateFormat";

const STATUS_BADGE = {
    active: { label: "Đang hoạt động", cls: "bg-green-100 text-green-700" },
    maintenance: { label: "Đang bảo trì", cls: "bg-yellow-100 text-yellow-700" },
    inactive: { label: "Không hoạt động", cls: "bg-red-100 text-red-700" },
};

export default function DetailsBusForm({ visible, onCancel, bus }) {
    if (!visible || !bus) return null;
    const statusMeta = STATUS_BADGE[String(bus.status || "").toLowerCase()] || {
        label: bus.status || "Không rõ",
        cls: "bg-slate-200 text-slate-700",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between border-b pb-2.5">
                    <h2 className="text-lg font-bold text-slate-900">Chi tiết xe buýt</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-8 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
                <div className="text-slate-700 flex flex-col sm:flex-row gap-4">
                    <div className="sm:w-1/3 flex flex-col items-center justify-center border rounded-lg p-4 bg-slate-50">
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSlxy5ORfVv_R_JxYHwwEOWcjZc1ZolMXV0w&s"
                            alt="Ảnh xe buýt"
                            className="w-24 h-24 rounded-full object-cover mb-3 border"
                        />
                        <div className="text-sm text-slate-500 mb-2">
                            Mã xe: <span className="font-semibold text-slate-800">{bus.bus_number}</span>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.cls}`}>
                            {statusMeta.label}
                        </span>
                    </div>

                    <div className="sm:w-2/3 flex flex-col gap-3">
                        <div className="border rounded-lg p-4 bg-slate-50 space-y-2 text-sm">
                            <div>
                                <span className="font-semibold">Biển số:</span> {bus.license_plate}
                            </div>
                            <div>
                                <span className="font-semibold">Số ghế:</span> {bus.capacity ?? "Chưa cập nhật"}
                            </div>
                            <div>
                                <span className="font-semibold">Thời gian tạo:</span> {formatDateTimeVi(bus.created_at)}
                            </div>
                        </div>
                        <div className="border rounded-lg p-3 bg-blue-50 text-blue-800 text-sm">
                            <span className="font-semibold">Ghi chú:</span>{" "}
                            {bus.status === "maintenance"
                                ? "Xe đang bảo trì, tạm không gán vào lịch trình mới."
                                : bus.status === "inactive"
                                    ? "Xe đang ngừng hoạt động."
                                    : "Sẵn sàng phục vụ."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
