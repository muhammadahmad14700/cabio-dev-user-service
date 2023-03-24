// routes/register/driver
const { authenticate, authorize } = require("../controllers/AuthController");
const { registerDriver, sendQRCodeInEmail } = require("../controllers/RegisterDriverController");

const router = require('express').Router();

// individual register/driver routes
// /register/driver/registerDriver
router.post('/registerDriver', authenticate, authorize('admin'), registerDriver);

router.post('/sendQRCodeInEmail', authenticate, authorize('admin'), sendQRCodeInEmail);

module.exports = router;