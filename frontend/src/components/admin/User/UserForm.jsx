import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Eye, EyeOff, Shield, Car, Users, Mail, User as UserIcon, Calendar, Clock } from "lucide-react";
import FormInput from "../../common/FormInput";
import Button from "../../common/Button";
import { formatDateTimeVi } from "../../../utils/dateFormat";

const ROLE_META = {
    admin: {
        label: "Quản trị viên",
        badgeCls: "bg-purple-100 text-purple-800 border-purple-200",
        Icon: Shield,
    },
    driver: {
        label: "Tài xế",
        badgeCls: "bg-amber-100 text-amber-800 border-amber-200",
        Icon: Car,
    },
    parent: {
        label: "Phụ huynh",
        badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-200",
        Icon: Users,
    },
};

function UserForm({ user, mode = "add", onCancel, onSubmit, onSwitchToEdit }) {
    const isEdit = mode === "edit";
    const isView = mode === "view";

    const [form, setForm] = useState({
        id: user?.id || null,
        username: user?.username || "",
        email: user?.email || "",
        password: "",
        role: user?.role || "parent",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setForm({
                id: user.id || null,
                username: user.username || "",
                email: user.email || "",
                password: "",
                role: user.role || "parent",
            });
        } else {
            setForm({
                id: null,
                username: "",
                email: "",
                password: "",
                role: "parent",
            });
        }
        setErrors({});
        setShowPassword(false);
    }, [user, mode]);

    const validate = () => {
        const nextErrors = {};

        if (!form.username.trim()) {
            nextErrors.username = "Tên đăng nhập không được để trống";
        } else if (form.username.trim().length < 3) {
            nextErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
        }

        if (!form.email.trim()) {
            nextErrors.email = "Email không được để trống";
        } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
            nextErrors.email = "Email không đúng định dạng";
        }

        if (!isEdit && !form.password) {
            nextErrors.password = "Mật khẩu là bắt buộc khi tạo tài khoản mới";
        } else if (form.password && form.password.length < 6) {
            nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name] || errors.submit) {
            setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isView) {
            onCancel();
            return;
        }
        if (!validate()) return;

        setSaving(true);
        setErrors((prev) => ({ ...prev, submit: "" }));

        try {
            const payload = {
                id: form.id,
                username: form.username.trim(),
                email: form.email.trim(),
                role: form.role,
            };

            if (!isEdit || form.password) {
                payload.password = form.password;
            }

            await onSubmit(payload, isEdit ? "edit" : "create");
        } catch (err) {
            setErrors((prev) => ({
                ...prev,
                submit: err?.message || "Không thể lưu tài khoản. Vui lòng thử lại.",
            }));
        } finally {
            setSaving(false);
        }
    };

    if (isView && user) {
        const roleInfo = ROLE_META[user.role] || {
            label: user.role || "Không rõ",
            badgeCls: "bg-gray-100 text-gray-800 border-gray-200",
            Icon: UserIcon,
        };
        const RoleIcon = roleInfo.Icon;

        return (
            <div className="space-y-5">
                {/* Banner tóm tắt tài khoản */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#174D2C] text-lg font-bold text-white">
                            {(user.username || "U").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900">{user.username}</div>
                            <div className="text-sm text-slate-500">Mã tài khoản: #{user.id}</div>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleInfo.badgeCls}`}
                    >
                        <RoleIcon size={14} />
                        {roleInfo.label}
                    </span>
                </div>

                {/* Chi tiết thông tin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-slate-200 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <UserIcon size={14} />
                            Tên đăng nhập
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{user.username}</div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Mail size={14} />
                            Email
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900 break-all">
                            {user.email || "--"}
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Calendar size={14} />
                            Ngày tạo
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                            {formatDateTimeVi(user.created_at)}
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Clock size={14} />
                            Cập nhật gần nhất
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                            {formatDateTimeVi(user.updated_at)}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Đóng
                    </Button>
                    {onSwitchToEdit && (
                        <Button type="button" variant="primary" onClick={onSwitchToEdit}>
                            Chỉnh sửa tài khoản
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    {errors.submit}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                    label="Tên đăng nhập (Username)"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="VD: driver4, parent01"
                    error={errors.username}
                    required
                    disabled={saving}
                />

                <FormInput
                    label="Vai trò (Role)"
                    name="role"
                    type="select"
                    value={form.role}
                    onChange={handleChange}
                    options={[
                        { value: "parent", label: "Phụ huynh (Parent)" },
                        { value: "driver", label: "Tài xế (Driver)" },
                        { value: "admin", label: "Quản trị viên (Admin)" },
                    ]}
                    required
                    disabled={saving}
                />
            </div>

            <FormInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="VD: user@school.com"
                error={errors.email}
                required
                disabled={saving}
            />

            <div>
                <label
                    htmlFor="user-password-input"
                    className="block text-sm font-medium text-slate-700 mb-1"
                >
                    Mật khẩu {isEdit ? "(để trống nếu giữ nguyên mật khẩu cũ)" : "*"}
                </label>
                <div className="relative">
                    <input
                        id="user-password-input"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange}
                        placeholder={isEdit ? "Nhập mật khẩu mới (tối thiểu 6 ký tự)..." : "Tối thiểu 6 ký tự"}
                        disabled={saving}
                        className={`w-full px-3 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                            errors.password ? "border-red-500" : "border-slate-300"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        tabIndex={-1}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
                    Hủy
                </Button>
                <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                    {isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
                </Button>
            </div>
        </form>
    );
}

UserForm.propTypes = {
    user: PropTypes.object,
    mode: PropTypes.oneOf(["add", "edit", "view"]),
    onCancel: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onSwitchToEdit: PropTypes.func,
};

export default UserForm;
