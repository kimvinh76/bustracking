import React, { useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import UserTable from "../../components/admin/User/UserTable";
import UserForm from "../../components/admin/User/UserForm";
import apiClient from "../../services/api";

function UserPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get("/users");
            setUsers(data);
        } catch (err) {
            setError(err.message || 'Lỗi khi tải danh sách users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Xác nhận xóa user "${user.username}"?`)) return;
        try {
            await apiClient.delete(`/users/${user.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (err) {
            console.error('Delete error:', err);
            alert("Xóa thất bại: " + (err.message || err.toString()));
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            const isEdit = Boolean(formData.id);
            
            if (isEdit) {
                // Update existing user
                const updated = await apiClient.put(`/users/${formData.id}`, formData);
                setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            } else {
                // Create new user
                const created = await apiClient.post("/users", formData);
                setUsers((prev) => [created, ...prev]);
            }
            
            setIsFormOpen(false);
            setEditingUser(null);
        } catch (err) {
            console.error('Form submit error:', err);
            alert("Lưu thất bại: " + (err.message || err.toString()));
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 space-y-6">
            <Header title="QUẢN LÝ TÀI KHOẢN" />

            <div>
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        Lỗi khi tải: {error}
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-lg h-[calc(100vh-180px)] flex flex-col">
                    <div className="flex-1 overflow-hidden">
                        <UserTable
                            users={users}
                            loading={loading}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={(user) =>
                                alert(`Username: ${user.username}\nEmail: ${user.email}\nRole: ${user.role}`)
                            }
                            onAdd={handleCreate}
                        />
                    </div>
                </div>

                {isFormOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white shadow-2xl rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <UserForm
                                user={editingUser}
                                mode={editingUser ? 'edit' : 'create'}
                                onCancel={() => setIsFormOpen(false)}
                                onSubmit={handleFormSubmit}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserPage;