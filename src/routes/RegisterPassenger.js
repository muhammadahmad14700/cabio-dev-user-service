// routes/register/passenger
const { anonymousAuthorize } = require("../controllers/AuthController");
const { registerPassenger } = require("../controllers/RegisterPassengerController");

const router = require('express').Router();

// individual register/passenger routes
// /register/passenger/registerPassenger
router.post('/registerPassenger', anonymousAuthorize, registerPassenger);

module.exports = router;