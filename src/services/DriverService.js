const DriverDAO = require('../dao/DriverDAO');
const driverDAO = new DriverDAO();

class DriverService {

  async updateProfile(data, file) {
    return await driverDAO.updateProfile(data, file);
  }

  async getDriverDailyStats(data) {
    return await driverDAO.getDriverDailyStats(data)
  }
  
  async updateDriverRadius(data) {
    return await driverDAO.updateDriverRadius(data);
  }

  async sendConnectRequestById(data) {
    return await driverDAO.sendConnectRequestById(data);
  }

  async sendConnectRequestByReferralCode(data) {
    return await driverDAO.sendConnectRequestByReferralCode(data);
  }

  async rejectConnectRequest(data) {
    return await driverDAO.rejectConnectRequest(data);
  }

  async connectWithChildDriver(data) {
    return await driverDAO.connectWithChildDriver(data);
  }

  async disconnectWithChildDriver(data) {
    return await driverDAO.disconnectWithChildDriver(data);
  }

  async listConnectRequests(data) {
    return await driverDAO.listConnectRequests(data);
  }

  async listChildDrivers(data) {
    return await driverDAO.listChildDrivers(data);
  }

  async listParentDrivers(data) {
    return await driverDAO.listParentDrivers(data);
  }

}

module.exports = DriverService;