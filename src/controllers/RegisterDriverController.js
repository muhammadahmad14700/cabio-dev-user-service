const requestValidator = require('../validators/RegisterDriverValidator');
const RegisterDriverService = require("../services/RegisterDriverService");
const registerDriverService = new RegisterDriverService();

module.exports = {
  registerDriver: async (req, res, next) => {
    try {
      requestValidator.registerDriver(req.body);
      await registerDriverService.registerDriver(req.body);
      return res.json({ success: true, msg: "Driver registered successfully" });
    }
    catch (e) {
      next(e);
    }
  },

  sendQRCodeInEmail: async (req, res, next) => {
    try {
      requestValidator.sendQRCodeInEmail(req.body);
      await registerDriverService.sendQRCodeInEmail(req.body);
      return res.json({ success: true, msg: "QRCode mail has been sent" });
    }
    catch (e) {
      next(e)
    }
  },
}