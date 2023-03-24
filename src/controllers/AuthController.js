const requestValidator = require('../validators/AuthValidator');
const { throwError } = require("../utils/Common");
const { verifyJWT, verifyBT } = require("../utils/AuthUtils");
const { anonymousRateLimiter, generalRateLimiter } = require('../config/rateLimiter');
const AuthService = require("../services/AuthService");
const authService = new AuthService();

module.exports = {
  getTokens: async (req, res, next) => {
    try {
      requestValidator.getTokens(req.body);
      let { token, refreshToken } = await authService.getTokens(req.body);
      return res.json({ success: true, token, refreshToken });
    }
    catch (e) {
      next(e)
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      requestValidator.refreshToken(req.body);
      let token = await authService.refreshToken(req.body);
      return res.json({ success: true, token });
    }
    catch (e) {
      next(e)
    }
  },

  registerUser: async (req, res, next) => {
    try {
      requestValidator.registerUser(req.body);
      let user = await authService.registerUser(req.body);
      return res.json({ success: true, msg: "User registered successfully", user });
    }
    catch (e) {
      next(e);
    }
  },

  updateUserEmail: async (req, res, next) => {
    try {
      requestValidator.updateUserEmail(req.body);
      await authService.updateUserEmail(req.body);
      return res.json({ success: true, msg: "Email is successfully updated!" });
    }
    catch (e) {
      next(e);
    }
  },

  updateUserPassword: async (req, res, next) => {
    try {
      requestValidator.updateUserPassword(req.body);
      await authService.updateUserPassword(req.body);
      return res.json({ success: true, msg: "Password is successfully updated!" });
    }
    catch (e) {
      next(e);
    }
  },

  updateUserPasswordById: async (req, res, next) => {
    try {
      requestValidator.updateUserPasswordById(req.body);
      await authService.updateUserPasswordById(req.body);
      return res.json({ success: true, msg: "Password is successfully updated!" });
    }
    catch (e) {
      next(e);
    }
  },
  
  authenticate: async (req, res, next) => {
    try {
      if (req.headers && req.headers.authorization) {
        if (req.headers.authorization.split(' ')[0] === 'JWT') {
          let token = req.headers.authorization.split(' ')[1];
          let user = await verifyJWT(token);
          req.body._user = user;
          return next();
        }
        else if (req.headers.authorization.split(' ')[0] === 'Bearer') {
          let token = req.headers.authorization.split(' ')[1];
          let user = verifyBT(token);
          if (!req.body._user) req.body._user = user;
          return next();
        }
      }
      throwError(401, 'Authorization Header Not Present');
    }
    catch (e) {
      next(e)
    }
  },

  authorize: (role, limiterType = "short") => {
    return async (req, res, next) => {
      try {
        if (role == "all"
          || req.body._user.role == "admin" 
          || req.body._user.role == "tester"
          || role == req.body._user.role) {
          await generalRateLimiter(limiterType, req, res);
          next();
        }
        else throwError(403, "Unauthorized");
      }
      catch (e) {
        next(e);
      }
    }
  },

  anonymousAuthorize: async (req, res, next) => {
    try {
      await anonymousRateLimiter(req, res);
      next();
    }
    catch (e) {
      next(e)
    }
  },
}
