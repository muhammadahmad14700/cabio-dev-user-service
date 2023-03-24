// routes/index.js
const router = require('express').Router();

// api/v1/user/auth
router.use('/auth', require('./Auth'));

// api/v1/user/register/passenger
router.use('/register/passenger', require('./RegisterPassenger'));

// api/v1/user/register/driver
router.use('/register/driver', require('./RegisterDriver'));

// api/v1/user/passenger
router.use('/passenger', require('./Passenger'));

// api/v1/user/driver
router.use('/driver', require('./Driver'));

module.exports = router;  