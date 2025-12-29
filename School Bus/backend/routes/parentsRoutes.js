// /backend/routes/parentsRoutes.js
import express from 'express';
import ParentService from '../services/parentService.js';

const router = express.Router();

// GET /api/parents - danh sách phụ huynh
router.get('/', async (req, res) => {
  console.log('🔹 GET /api/parents - Lấy danh sách phụ huynh');
  try {
    const parents = await ParentService.getAllParents();
    console.log(`✅ Lấy thành công ${parents.length} phụ huynh`);
    res.json({ success: true, data: parents, count: parents.length });
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách phụ huynh:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/parents/:id
router.get('/:id', async (req, res) => {
  console.log(`🔹 GET /api/parents/${req.params.id} - Lấy thông tin phụ huynh`);
  try {
    const parent = await ParentService.getParentById(req.params.id);
    if (!parent) {
      console.log('❌ Không tìm thấy phụ huynh');
      return res.status(404).json({ success: false, message: 'Không tìm thấy phụ huynh' });
    }
    console.log(`✅ Lấy thông tin phụ huynh ${parent.name}`);
    res.json({ success: true, data: parent });
  } catch (err) {
    console.error('❌ Lỗi khi lấy thông tin phụ huynh:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/parents/:id/children
router.get('/:id/children', async (req, res) => {
  console.log(`🔹 GET /api/parents/${req.params.id}/children - Lấy danh sách con`);
  try {
    const { id } = req.params;
    const parent = await ParentService.getParentWithChildren(id);
    if (!parent) {
      console.log('❌ Không tìm thấy phụ huynh');
      return res.status(404).json({ success: false, message: 'Không tìm thấy phụ huynh' });
    }
    console.log(`✅ Lấy ${parent.children.length} con của phụ huynh ${parent.name}`);
    res.json({ success: true, data: parent.children, count: parent.children.length });
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách con:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/parents - thêm phụ huynh
router.post('/', async (req, res) => {
  console.log('🔹 POST /api/parents - Thêm phụ huynh mới');
  try {
    const parentData = req.body;
    const parent = await ParentService.createParent(parentData);
    console.log(`✅ Thêm phụ huynh thành công: ${parent.name}`);
    res.status(201).json({ success: true, message: 'Thêm phụ huynh thành công', data: parent });
  } catch (err) {
    console.error('❌ Lỗi khi thêm phụ huynh:', err.message);
    const statusCode = err.message.includes('Thiếu thông tin') || err.message.includes('đã tồn tại') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

// PUT /api/parents/:id - cập nhật phụ huynh
router.put('/:id', async (req, res) => {
  console.log(`🔹 PUT /api/parents/${req.params.id} - Cập nhật phụ huynh`);
  try {
    const { id } = req.params;
    const parentData = req.body;
    const parent = await ParentService.updateParent(id, parentData);
    console.log(`✅ Cập nhật phụ huynh thành công: ${parent.name}`);
    res.json({ success: true, message: 'Cập nhật phụ huynh thành công', data: parent });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật phụ huynh:', err.message);
    const statusCode = err.message.includes('Không tìm thấy') ? 404 : 
                       err.message.includes('Thiếu thông tin') || err.message.includes('đã tồn tại') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

// DELETE /api/parents/:id
router.delete('/:id', async (req, res) => {
  console.log(`🔹 DELETE /api/parents/${req.params.id} - Xóa phụ huynh`);
  try {
    const { id } = req.params;
    await ParentService.deleteParent(id);
    console.log(`✅ Xóa phụ huynh thành công`);
    res.json({ success: true, message: 'Xóa phụ huynh thành công' });
  } catch (err) {
    console.error('❌ Lỗi khi xóa phụ huynh:', err.message);
    const statusCode = err.message.includes('Không tìm thấy') ? 404 : 
                       err.message.includes('còn có con') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

export default router;