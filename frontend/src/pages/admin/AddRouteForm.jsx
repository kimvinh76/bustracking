import { useState, useEffect } from "react";
import Modal from "../../components/UI/Modal";
import FormInput from "../../components/common/FormInput";
import Button from "../../components/common/Button";
export default function AddRouteForm({
  visible,
  onCancel,
  title,
  onSubmit,
  mode = "add",
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    route_name: "",
    shift_type: "morning",
    distance: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset errors when modal opens
  useEffect(() => {
    if (visible) {
      if (mode === "edit" && initialData) {
        const safeStatus = ["active", "inactive"].includes(initialData.status)
          ? initialData.status
          : "inactive";
        setFormData({
          route_name: initialData.route_name || "",
          shift_type: initialData.shift_type || "morning",
          distance: initialData.distance || 0,
          status: safeStatus,
        });
      } else {
        setFormData({
          route_name: "",
          shift_type: "morning",
          distance: 0,
          status: "active",
        });
      }
      setErrors({});
    }
  }, [visible, mode, initialData]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.route_name || !formData.route_name.trim()) {
      newErrors.route_name = "Tên tuyến đường là bắt buộc";
    } else if (formData.route_name.trim().length < 3) {
      newErrors.route_name = "Tên tuyến đường phải có ít nhất 3 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: "" }));

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || "Thao tác thất bại. Vui lòng thử lại.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedTitle =
    title ||
    (mode === "edit" ? "Chỉnh sửa tuyến đường" : "Thêm tuyến đường mới");
  const submitButtonText = mode === "edit" ? "Cập nhật" : "Tạo & Chọn trạm trên bản đồ";

  return (
    <Modal isOpen={visible} onClose={onCancel} title={resolvedTitle} size="md">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errors.submit && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.submit}
          </div>
        )}
        <FormInput
          label="Tên tuyến đường"
          name="name"
          value={formData.route_name}
          onChange={(e) =>
            setFormData({ ...formData, route_name: e.target.value })
          }
          placeholder="VD: Hồng bàng - An Dương Vương"
          error={errors.route_name}
          required
        />

        <FormInput
          label="Phân ca (Sáng / Chiều)"
          name="shift_type"
          type="select"
          value={formData.shift_type}
          onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
          options={[
            { value: "morning", label: "Ca Sáng" },
            { value: "afternoon", label: "Ca Chiều" },
          ]}
          required
        />

        {mode === "edit" ? (
          <FormInput
            label="Khoảng cách (km)"
            name="distance"
            value={formData.distance ? `${Number(formData.distance).toFixed(2)} km` : "0 km"}
            onChange={() => {}}
            readOnly
            disabled
          />
        ) : (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
            Quãng đường (km) và thời gian dự kiến sẽ được hệ thống <b>tự động đo theo đường thực tế</b> ngay sau khi bạn chọn các điểm dừng ở bước tiếp theo.
          </div>
        )}

        <FormInput
          label="Trạng thái"
          name="status"
          type="select"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: "active", label: "Đang hoạt động" },
            { value: "inactive", label: "Không hoạt động" },
          ]}
          required
        />

        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
