const multer = require('multer');
const imageUpload = require('../config/imageUpload').single('image');
const requestValidator = require('../validators/DriverValidator');
const { throwError } = require("../utils/Common");
const DriverService = require("../services/DriverService");
const driverService = new DriverService();

module.exports = {
  updateProfile: async (req, res, next) => {
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
        await driverService.updateProfile(req.body, req.file);
        return res.json({ success: true, msg: "Profile Updated Successfully" })
      }
      catch (e) {
        next(e)
      }
    });
  },

  getDriverDailyStats : async (req, res, next) => {
    try {
      requestValidator.getDriverDailyStats(req.body);
      let driverDailyStats = await driverService.getDriverDailyStats(req.body);
      return res.json({ success: true, driverDailyStats});
    } catch (e) {
      next(e)
    }
  },

  updateDriverRadius: async (req, res, next) => {
    try {
      requestValidator.updateDriverRadius(req.body);
      await driverService.updateDriverRadius(req.body);
      return res.json({ success: true, msg: "Radius set successfully" });
    } catch (e) {
      next(e);
    }
  },

  sendConnectRequestById: async (req, res, next) => {
    try {
      requestValidator.sendConnectRequestById(req.body);
      let driverName = await driverService.sendConnectRequestById(req.body);
      return res.json({ success: true, driverName });
    }
    catch (e) {
      next(e)
    }
  },

  sendConnectRequestByReferralCode: async (req, res, next) => {
    try {
      requestValidator.sendConnectRequestByReferralCode(req.body);
      let driverName = await driverService.sendConnectRequestByReferralCode(req.body);
      return res.json({ success: true, driverName });
    }
    catch (e) {
      next(e)
    }
  },

  rejectConnectRequest: async (req, res, next) => {
    try {
      requestValidator.rejectConnectRequest(req.body);
      await driverService.rejectConnectRequest(req.body);
      return res.json({ success: true, msg: "Connect Request Rejected Successfully" });
    }
    catch (e) {
      next(e)
    }
  },

  connectWithChildDriver: async (req, res, next) => {
    try {
      requestValidator.connectWithChildDriver(req.body);
      await driverService.connectWithChildDriver(req.body);
      return res.json({ success: true, msg: "Child Driver Connected Successfully" });
    }
    catch (e) {
      next(e)
    }
  },

  disconnectWithChildDriver: async (req, res, next) => {
    try {
      requestValidator.disconnectWithChildDriver(req.body);
      await driverService.disconnectWithChildDriver(req.body);
      return res.json({ success: true, msg: "Child Driver Disconnected Successfully" });
    }
    catch (e) {
      next(e)
    }
  },

  listConnectRequests: async (req, res, next) => {
    try {
      requestValidator.listConnectRequests(req.body);
      let requests = await driverService.listConnectRequests(req.body);
      return res.json({ success: true, requests });
    }
    catch (e) {
      next(e)
    }
  },

  listChildDrivers: async (req, res, next) => {
    try {
      requestValidator.listChildDrivers(req.body);
      let drivers = await driverService.listChildDrivers(req.body);
      return res.json({ success: true, drivers });
    }
    catch (e) {
      next(e)
    }
  },

  listParentDrivers: async (req, res, next) => {
    try {
      requestValidator.listParentDrivers(req.body);
      let drivers = await driverService.listParentDrivers(req.body);
      return res.json({ success: true, drivers });
    }
    catch (e) {
      next(e)
    }
  }

}