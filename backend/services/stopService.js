import StopModel from '../models/Stop.js';

class StopService {
  static async getAllStops() {
    console.log(' SERVICE: Lấy tất cả trạm');
    const stops = await StopModel.findAll();
    return stops;
  }
}

export default StopService;
