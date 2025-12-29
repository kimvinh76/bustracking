// /backend/routes/userRoutes.js
import express from "express";
import UserService from "../services/userService.js";

const router = express.Router();

// GET /api/users → Lấy danh sách user
router.get("/", async (req, res) => {
    console.log('🔹 GET /api/users - Lấy danh sách user');
    try {
        const users = await UserService.getAllUsers();
        console.log(`✅ Lấy thành công ${users.length} user`);
        res.json(users);
    } catch (err) {
        console.error('❌ Lỗi khi lấy danh sách user:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/users/:id → Lấy 1 user
router.get("/:id", async (req, res) => {
    console.log(`🔹 GET /api/users/${req.params.id} - Lấy thông tin user`);
    try {
        const user = await UserService.getUserById(req.params.id);
        if (!user) {
            console.log('❌ Không tìm thấy user');
            return res.status(404).json({ message: 'Không tìm thấy user' });
        }
        console.log(`✅ Lấy thông tin user ${user.username}`);
        res.json(user);
    } catch (err) {
        console.error('❌ Lỗi khi lấy user:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users → Thêm user mới
router.post("/", async (req, res) => {
    console.log('🔹 POST /api/users - Thêm user mới');
    try {
        const userData = req.body;
        const newUser = await UserService.createUser(userData);
        console.log(`✅ Tạo user thành công: ${newUser.username}`);
        res.json(newUser);
    } catch (err) {
        console.error('❌ Lỗi khi tạo user:', err.message);
        const statusCode = err.message.includes('Thiếu thông tin') || err.message.includes('đã tồn tại') ? 400 : 500;
        res.status(statusCode).json({ message: err.message });
    }
});

// PUT /api/users/:id → Cập nhật user
router.put("/:id", async (req, res) => {
    console.log(`🔹 PUT /api/users/${req.params.id} - Cập nhật user`);
    try {
        const { id } = req.params;
        const userData = req.body;
        const updatedUser = await UserService.updateUser(id, userData);
        console.log(`✅ Cập nhật user thành công: ${updatedUser.username}`);
        res.json(updatedUser);
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật user:', err.message);
        const statusCode = err.message.includes('Không tìm thấy') ? 404 :
                           err.message.includes('đã tồn tại') ? 400 : 500;
        res.status(statusCode).json({ message: err.message });
    }
});

// DELETE /api/users/:id → Xóa user
router.delete("/:id", async (req, res) => {
    console.log(`🔹 DELETE /api/users/${req.params.id} - Xóa user`);
    try {
        await UserService.deleteUser(req.params.id);
        console.log(`✅ Xóa user thành công`);
        res.json({ message: "Xóa thành công" });
    } catch (err) {
        console.error('❌ Lỗi khi xóa user:', err.message);
        const statusCode = err.message.includes('Không tìm thấy') ? 404 : 500;
        res.status(statusCode).json({ message: err.message });
    }
});

export default router;
