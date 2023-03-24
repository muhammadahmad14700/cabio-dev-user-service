const PassengerDAO = require('../dao/PassengerDAO');
const passengerDAO = new PassengerDAO();

class PassengerService {

  async updateProfile(data, file) {
    return await passengerDAO.updateProfile(data, file);
  }

  async savePassengerPreferences(data) {
    return await passengerDAO.savePassengerPreferences(data);
  }

  async listPassengerPreferences(data) {
    return await passengerDAO.listPassengerPreferences(data);
  }

  async saveFavouritePlace(data) {
    return await passengerDAO.saveFavouritePlace(data);
  }

  async removeFavouritePlace(data) {
    return await passengerDAO.removeFavouritePlace(data);
  }

  async listFavouritePlaces(data) {
    return await passengerDAO.listFavouritePlaces(data);
  }

  async listConnectableDrivers(data) {
    return await passengerDAO.listConnectableDrivers(data);
  }

  async filterConnectableDrivers(data) {
    return await passengerDAO.filterConnectableDrivers(data);
  }

  async sendConnectRequestById(data) {
    return await passengerDAO.sendConnectRequestById(data);
  }

  async sendConnectRequestByReferralCode(data) {
    return await passengerDAO.sendConnectRequestByReferralCode(data);
  }

  async rejectConnectRequest(data) {
    return await passengerDAO.rejectConnectRequest(data);
  }

  async connectWithPassenger(data) {
    return await passengerDAO.connectWithPassenger(data);
  }

  async getConnectedDriverDetail(data) {
    return await passengerDAO.getConnectedDriverDetail(data);
  }

  async listConnectRequests(data) {
    return await passengerDAO.listConnectRequests(data);
  }

  async listConnectedPassengers(data) {
    return await passengerDAO.listConnectedPassengers(data);
  }
}

module.exports = PassengerService;