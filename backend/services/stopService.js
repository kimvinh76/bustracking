import StopModel from '../models/Stop.js';
import RouteService from './routeService.js';

function parseCoordinate(value, min, max, label) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new Error(`${label} không hợp lệ (phải nằm trong khoảng ${min} đến ${max})`);
  }
  return Number(num.toFixed(8));
}

class StopService {
  static async getAllStops() {
    console.log(' SERVICE: Lấy tất cả trạm');
    return StopModel.findAll();
  }

  static async createStop(data) {
    const name = String(data?.name || '').trim();
    if (name.length < 2) {
      throw new Error('Tên trạm dừng phải có ít nhất 2 ký tự');
    }

    const address = String(data?.address || '').trim();
    const latitude = parseCoordinate(data?.latitude, -90, 90, 'Vĩ độ (latitude)');
    const longitude = parseCoordinate(data?.longitude, -180, 180, 'Kinh độ (longitude)');
    const status = data?.status === 'inactive' ? 'inactive' : 'active';

    return StopModel.create({ name, address, latitude, longitude, status });
  }

  static async updateStop(id, data) {
    const existing = await StopModel.findById(id);
    if (!existing) {
      throw new Error('Không tìm thấy trạm dừng');
    }

    const name = data?.name !== undefined ? String(data.name).trim() : existing.name;
    if (!name || name.length < 2) {
      throw new Error('Tên trạm dừng phải có ít nhất 2 ký tự');
    }

    const address =
      data?.address !== undefined ? String(data.address || '').trim() : existing.address;

    const latitude =
      data?.latitude !== undefined
        ? parseCoordinate(data.latitude, -90, 90, 'Vĩ độ (latitude)')
        : existing.latitude;

    const longitude =
      data?.longitude !== undefined
        ? parseCoordinate(data.longitude, -180, 180, 'Kinh độ (longitude)')
        : existing.longitude;

    const status = data?.status !== undefined
      ? (data.status === 'inactive' ? 'inactive' : 'active')
      : existing.status;

    const updatedStop = await StopModel.update(id, {
      name,
      address,
      latitude,
      longitude,
      status,
    });

    // Tự động tính lại khoảng cách mọi tuyến đi qua trạm vừa cập nhật
    const affectedRouteIds = await StopModel.findRouteIdsByStopId(id);
    if (affectedRouteIds.length > 0) {
      await Promise.allSettled(
        affectedRouteIds.map((routeId) => RouteService.recalculateRouteDistance(routeId))
      );
    }

    return {
      stop: updatedStop,
      updatedRouteIds: affectedRouteIds,
    };
  }

  static async deleteStop(id) {
    const existing = await StopModel.findById(id);
    if (!existing) {
      throw new Error('Không tìm thấy trạm dừng');
    }

    const { routeCount, studentCount } = await StopModel.countReferences(id);
    if (routeCount > 0 || studentCount > 0) {
      throw new Error(
        `Không thể xóa trạm "${existing.name}" vì đang gắn với ${routeCount} tuyến đường và ${studentCount} học sinh đăng ký`
      );
    }

    const deleted = await StopModel.delete(id);
    if (!deleted) {
      throw new Error('Không thể xóa trạm dừng');
    }
    return { message: 'Xóa trạm dừng thành công' };
  }
}

export default StopService;
