import { useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import UserTable from "../../components/admin/User/UserTable";
import UserForm from "../../components/admin/User/UserForm";
import Modal from "../../components/UI/Modal";
import ConfirmDialog from "../../components/UI/ConfirmDialog";
import boxDialog from "../../components/UI/BoxDialog";
import apiClient from "../../services/api";

function UserPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("add"); // 'add' | 'edit' | 'view'
    const [selectedUser, setSelectedUser] = useState(null);

    const [userToDelete, setUserToDelete] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get("/users");
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.message || "Lỗi khi tải danh sách tài khoản");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setFormMode("add");
        setSelectedUser(null);
        setIsFormOpen(true);
    };

    const handleView = (user) => {
        setFormMode("view");
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleEdit = (user) => {
        setFormMode("edit");
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleDeleteRequest = (user) => {
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await apiClient.delete(`/users/${userToDelete.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            setError(null);
            boxDialog("success");
        } catch (err) {
            console.error("Delete error:", err);
            setError("Xóa tài khoản thất bại: " + (err?.message || "Vui lòng thử lại."));
            boxDialog("error");
        } finally {
            setUserToDelete(null);
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            const isEdit = formMode === "edit" && Boolean(formData.id);
            if (isEdit) {
                const updated = await apiClient.put(`/users/${formData.id}`, formData);
                setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            } else {
                const created = await apiClient.post("/users", formData);
                setUsers((prev) => [created, ...prev]);
            }
            setIsFormOpen(false);
            setSelectedUser(null);
            setError(null);
            boxDialog("success");
        } catch (err) {
            console.error("Form submit error:", err);
            boxDialog("error");
            throw err;
        }
    };

    const modalTitle =
        formMode === "edit"
            ? "Chỉnh sửa tài khoản"
            : formMode === "view"
                ? "Chi tiết tài khoản"
                : "Thêm tài khoản mới";

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 space-y-6">
            <Header title="QUẢN LÝ TÀI KHOẢN" />

            {error && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-xs font-semibold underline cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            )}

            <UserTable
                users={users}
                loading={loading}
                onAdd={handleCreate}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
            />

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={modalTitle}
                size="md"
            >
                <UserForm
                    user={selectedUser}
                    mode={formMode}
                    onCancel={() => setIsFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    onSwitchToEdit={
                        formMode === "view" && selectedUser
                            ? () => setFormMode("edit")
                            : undefined
                    }
                />
            </Modal>

            <ConfirmDialog
                isOpen={Boolean(userToDelete)}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDelete}
                title="Xác nhận xóa tài khoản"
                message={`Bạn có chắc muốn xóa tài khoản "${userToDelete?.username}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
            />
        </div>
    );
}

export default UserPage;
