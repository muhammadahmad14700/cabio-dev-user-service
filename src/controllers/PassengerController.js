const multer = require('multer');
const imageUpload = require('../config/imageUpload').single('image');
const requestValidator = require('../validators/PassengerValidator');
const PassengerService = require("../services/PassengerService");
const passengerService = new PassengerService();
const { throwError } = require("../utils/Common");

module.exports = {
  updateProfile : async (req, res, next) => {
    imageUpload(req, res, async (err) => {
      try {
        if (err instanceof multer.MulterError) {
          // image too large
          throwError(413, err.message);
        } else if (err) {
          // Unsupported image type
          throwError(415, err.message);
        }
        requestValidator.updateProfile(req);
        await passengerService.updateProfile(req.body, req.file);
        return res.json({ success: true,  msg: "Profile Updated Successfully" })
      }
      catch (e) {
        next(e)
      }
    });
  },

  savePassengerPreferences: async (req, res, next) => {
    try {
      requestValidator.savePassengerPreferences(req.body);
      let preferences = await passengerService.savePassengerPreferences(req.body);
      return res.json({ success: true, preferences });
    }
    catch (e) {
      next(e)
    }
  },

  listPassengerPreferences: async (req, res, next) => {
    try {
      requestValidator.listPassengerPreferences(req.body);
      let preferences = await passengerService.listPassengerPreferences(req.body);
      return res.json({ success: true, preferences });
    }
    catch (e) {
      next(e)
    }
  },

  saveFavouritePlace: async (req, res, next) => {
    try {
      requestValidator.saveFavouritePlace(req.body);
      await passengerService.saveFavouritePlace(req.body);
      return res.json({ success: true, msg: "Place added successfully" });
    }
    catch (e) {
      next(e)
    }
  },

  removeFavouritePlace: async (req, res, next) => {
    try {
      requestValidator.removeFavouritePlace(req.body);
      await passengerService.removeFavouritePlace(req.body);
      return res.json({ success: true, msg: "Place removed successfully" });
    }
    catch (e) {
      next(e)
    }
  },

  listFavouritePlaces: async (req, res, next) => {
    try {
      requestValidator.listFavouritePlaces(req.body);
      let places = await passengerService.listFavouritePlaces(req.body);
      return res.json({ success: true, places });
    }
    catch (e) {
      next(e)
    }
  },

  listConnectableDrivers: async (req, res, next) => {
    try {
      requestValidator.listConnectableDrivers(req.body);
      let drivers = await passengerService.listConnectableDrivers(req.body);
      return res.json({ success: true, drivers });
    }
    catch (e) {
      next(e)
    }
  },

  filterConnectableDrivers: async (req, res, next) => {
    try {
      requestValidator.filterConnectableDrivers(req.body);
      let drivers = await passengerService.filterConnectableDrivers(req.body);
      return res.json({ success: true, drivers });
    }
    catch (e) {
      next(e)
    }
  },

  sendConnectRequestById: async (req, res, next) => {
    try {
      requestValidator.sendConnectRequestById(req.body);
      await passengerService.sendConnectRequestById(req.body);
      return res.json({ success: true, msg: "Connect request sent successfully" });
    }
    catch (e) {
      next(e)
    }
  },

  sendConnectRequestByReferralCode: async (req, res, next) => {
    try {
      requestValidator.sendConnectRequestByReferralCode(req.body);
      let driverName = await passengerService.sendConnectRequestByReferralCode(req.body);
      return res.json({ success: true, driverName });
    }
    catch (e) {
      next(e)
    }
  },

  rejectConnectRequest: async (req, res, next) => {
    try {
      requestValidator.rejectConnectRequest(req.body);
      await passengerService.rejectConnectRequest(req.body);
      return res.json({ success: true,  msg: "connect request rejected successfully" });
    }
    catch (e) {
      next(e)
    }
  },

  connectWithPassenger: async (req, res, next) => {
    try {
      requestValidator.connectWithPassenger(req.body);
      await passengerService.connectWithPassenger(req.body);
      return res.json({ success: true, msg: "Passenger Connected Successfully" });
    }
    catch (e) {
      next(e)
    }
  },

  getConnectedDriverDetail: async (req, res, next) => {
    try {
      requestValidator.getConnectedDriverDetail(req.body);
      let connectedDriver = await passengerService.getConnectedDriverDetail(req.body);
      return res.json({ success: true, connectedDriver });
    }
    catch (e) {
      next(e)
    }
  },

  listConnectRequests: async (req, res, next) => {
    try {
      requestValidator.listConnectRequests(req.body);
      let requests = await passengerService.listConnectRequests(req.body);
      return res.json({ success: true, requests });
    }
    catch (e) {
      next(e)
    }
  },

  listConnectedPassengers: async (req, res, next) => {
    try {
      requestValidator.listConnectedPassengers(req.body);
      let passengers = await passengerService.listConnectedPassengers(req.body);
      return res.json({ success: true, passengers });
    }
    catch (e) {
      next(e)
    }
  }
}