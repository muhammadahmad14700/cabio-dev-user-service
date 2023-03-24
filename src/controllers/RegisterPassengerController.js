const requestIp = require('request-ip');
const requestValidator = require('../validators/RegisterPassengerValidator');
const RegisterPassengerService = require("../services/RegisterPassengerService");
const registerPassengerService = new RegisterPassengerService();

module.exports = {
  registerPassenger: async (req, res, next) => {
    try {
      requestValidator.registerPassenger(req.body);
      req.body.user_ip = req.headers["x-appengine-user-ip"] || requestIp.getClientIp(req);;
      let passengerId = await registerPassengerService.registerPassenger(req.body);
      return res.json({ success: true, msg: "Passenger registered successfully", passengerId });
    }
    catch (e) {
      next(e);
    }
  }
}