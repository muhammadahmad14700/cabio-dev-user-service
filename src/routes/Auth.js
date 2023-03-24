// routes/Auth
const { authenticate, authorize, anonymousAuthorize, getTokens, refreshToken, registerUser, 
  updateUserEmail, updateUserPassword, updateUserPasswordById } = require("../controllers/AuthController");

const router = require('express').Router();

// individual auth routes
// /auth/getTokens
router.post('/getTokens', anonymousAuthorize, getTokens);

router.post('/refreshToken', anonymousAuthorize, refreshToken);

router.post('/registerUser', anonymousAuthorize, registerUser);

router.post('/updateUserEmail', authenticate, authorize("admin"), updateUserEmail);

router.post('/updateUserPassword', anonymousAuthorize, updateUserPassword);

router.post('/updateUserPasswordById', authenticate, authorize("all"), updateUserPasswordById);

module.exports = router;