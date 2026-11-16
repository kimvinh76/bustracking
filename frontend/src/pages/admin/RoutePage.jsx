import { Eye, SlidersHorizontal, Map } from "lucide-react";
import DetailsBusForm from "./DetailsBusForm";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/admin/Header";
import Table from "../../components/common/Table";
import ConfirmDialog from "../../components/UI/ConfirmDialog";
import apiClient from "../../services/api";
import boxDialog from "../../components/UI/BoxDialog";
import AddRouteForm from "./AddRouteForm";

export default function RoutePage() {
  const navigate = useNavigate();
  const [isOpenFormAdd, setIsOpenFormAdd] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false); // State cho form chỉnh sửa
  const [selectedRouteForEdit, setSelectedRouteForEdit] = useState(null); // Lưu tuyến đường đang chỉnh sửa
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔵 Fetching routes from API...");
        const data = await apiClient.get("/routes", {
          timeout: 15000, // 15 giây thay vì 10 giây
        });
        console.log(" Routes response:", data);

        if (data) {
          // Map backend data to frontend format
          const mappedRoutes = data.map((route) => ({
            ...route,
            name: route.route_name || route.name,
            // Backend trả về route_name
          }));
          setRoutes(mappedRoutes);
        } else {
          console.warn(" No routes data in response");
          setRoutes([]);
        }
      } catch (error) {
        console.error(" Error fetching routes:", error);
        setError("Không thể tải danh sách tuyến đường. Vui lòng thử lại.");
        setRoutes([]); // Set empty array nếu lỗi
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  // Tạo route mới -> chuyển thẳng sang màn hình Xếp Trạm để chọn trạm và tính khoảng cách
  const handleCreateRoute = async (routeData) => {
    try {
      setError(null);
      const created = await apiClient.post("/routes", routeData);
      if (created) {
        const mapped = { ...created, name: created.route_name || created.name };
        setRoutes((prev) => [...prev, mapped]);
        setIsOpenFormAdd(false);
        boxDialog("success");
        if (created.id) {
          navigate(`/admin/routes/${created.id}/builder`);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tạo route:", error);
      setError(error?.message || "Không thể tạo tuyến đường. Vui lòng thử lại.");
      boxDialog("error");
      throw error;
    }
  };

  // Cập nhật route hiện có
  const handleUpdateRoute = async (routeData) => {
    try {
      setError(null);
      const updated = await apiClient.put(
        `/routes/${selectedRouteForEdit.id}`,
        routeData
      );
      if (updated) {
        const mapped = { ...updated, name: updated.route_name || updated.name };
        setRoutes((prev) =>
          prev.map((r) => (r.id === selectedRouteForEdit.id ? mapped : r))
        );
        boxDialog("success");
        setIsEditOpen(false);
        setSelectedRouteForEdit(null);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật route:", error);
      setError(error?.message || "Không thể cập nhật tuyến đường. Vui lòng thử lại.");
      boxDialog("error");
      throw error; // Re-throw để form biết có lỗi
    }
  };
  // Xóa route
  const handleDeleteRoute = async (id) => {
    try {
      const data = await apiClient.delete(`/routes/${id}`);
      if (data) {
        setRoutes((prev) => prev.filter((route) => route.id !== id));
        boxDialog("success", "Xóa tuyến đường thành công!");
      }
    } catch (error) {
      console.error("Lỗi khi xóa route:", error);
      boxDialog("error");
    }
  };

  // xóa
  const handleDeleteClick = (route) => {
    setSelectedRoute(route);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedRoute) {
      await handleDeleteRoute(selectedRoute.id);
      setSelectedRoute(null);
    }
  };

  // Filter routes
  const filteredRoutes = routes.filter((route) => {
    // Kiểm tra null/undefined để tránh lỗi
    const routeName = route?.name || "";
    const routeId = route?.id?.toString() || "";

    const matchesSearch =
      routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routeId.includes(searchTerm);

    const matchesStatus = !statusFilter || route?.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "id",
      header: "Mã tuyến đường",
    },
    {
      key: "route_name",
      header: "Tên tuyến đường",
    },
    {
      key: "shift_type",
      header: "Ca chạy",
      render: (value) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            value === "afternoon"
              ? "bg-orange-100 text-orange-700"
              : "bg-sky-100 text-sky-700"
          }`}
        >
          {value === "afternoon" ? "Ca Chiều" : "Ca Sáng"}
        </span>
      ),
    },
    {
      key: "distance",
      header: "Khoảng cách",
      render: (value) => {
        const km = Number(value);
        if (!Number.isFinite(km) || km <= 0) {
          return (
            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              0 km (Chưa xếp trạm)
            </span>
          );
        }
        return <span className="font-semibold text-gray-800">{km.toFixed(2)} km</span>;
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (value) => {
        const normalizedStatus = value?.toString().toLowerCase().trim();

        return (
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
              normalizedStatus === "active"
                ? "bg-green-100 text-green-700"
                : normalizedStatus === "maintenance"
                ? "bg-yellow-100 text-yellow-700"
                : normalizedStatus === "inactive"
                ? "bg-red-100 text-red-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {normalizedStatus === "active"
              ? "Đang hoạt động"
              : normalizedStatus === "maintenance"
              ? "Đang bảo trì"
              : normalizedStatus === "inactive"
              ? "Không hoạt động"
              : `Không xác định (${value})`}
          </span>
        );
      },
    },
  ];

  const filters = [
    {
      placeholder: "Tất cả trạng thái",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "active", label: "Đang hoạt động" },
        { value: "inactive", label: "Không hoạt động" },
      ],
      minWidth: "130px",
    },
  ];
  return (
    <div className="space-y-6 ">
      <Header title="QUẢN LÝ TUYẾN ĐƯỜNG" />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl"></span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Đang tải danh sách tuyến đường...
          </p>
        </div>
      ) : (
        <Table
          title="Danh sách tuyến đường"
          data={filteredRoutes}
          columns={columns}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onAdd={() => setIsOpenFormAdd(true)}
          onEdit={(route) => { 
            setSelectedRouteForEdit(route);
            setIsEditOpen(true);
          }}
          onDelete={(route) => handleDeleteClick(route)}
          customActions={[
            {
              label: "Xếp Trạm",
              icon: Map,
              className: "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100",
              onClick: (route) => navigate(`/admin/routes/${route.id}/builder`)
            }
          ]}
          addButtonText="Thêm tuyến đường"
          filters={filters}
          emptyMessage={
            searchTerm || statusFilter
              ? "Không tìm thấy tuyến đường nào phù hợp"
              : "Chưa có tuyến đường nào"
          }
        />
      )}

      <AddRouteForm
        visible={isOpenFormAdd}
        onCancel={() => setIsOpenFormAdd(false)}
        onSubmit={handleCreateRoute}
        mode="add"
        title="Thêm tuyến đường mới"
      />

      {/* Form chỉnh sửa tuyến đường */}
      <AddRouteForm
        visible={isEditOpen}
        onCancel={() => setIsEditOpen(false)}
        onSubmit={handleUpdateRoute}
        mode="edit"
        initialData={selectedRouteForEdit}
        title="Chỉnh sửa tuyến đường"
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa tuyến đường "${selectedRoute?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </div>
  );
}
