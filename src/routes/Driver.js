// routes/driver
const { authenticate, authorize } = require("../controllers/AuthController");
const { updateProfile, getDriverDailyStats, updateDriverRadius, sendConnectRequestById, sendConnectRequestByReferralCode, rejectConnectRequest,
  connectWithChildDriver, disconnectWithChildDriver, listConnectRequests,
  listChildDrivers, listParentDrivers } = require("../controllers/DriverController");

const router = require('express').Router();

// individual driver routes
// /driver/updateProfile
router.post('/updateProfile', authenticate, authorize("driver"), updateProfile);

router.post('/getDriverDailyStats', authenticate, authorize("driver"), getDriverDailyStats);

router.post('/updateDriverRadius', authenticate, authorize("driver"), updateDriverRadius);

router.post('/sendConnectRequestById', authenticate, authorize("driver"), sendConnectRequestById);

router.post('/sendConnectRequestById', authenticate, authorize("driver"), sendConnectRequestById);

router.post('/sendConnectRequestByReferralCode', authenticate, authorize("driver"), sendConnectRequestByReferralCode);

router.post('/rejectConnectRequest', authenticate, authorize("driver"), rejectConnectRequest);

router.post('/connectWithChildDriver', authenticate, authorize("driver"), connectWithChildDriver);

router.post('/disconnectWithChildDriver', authenticate, authorize("driver"), disconnectWithChildDriver);

router.post('/listConnectRequests', authenticate, authorize("driver"), listConnectRequests);

router.post('/listChildDrivers', authenticate, authorize("driver"), listChildDrivers);

router.post('/listParentDrivers', authenticate, authorize("driver"), listParentDrivers);

module.exports = router;