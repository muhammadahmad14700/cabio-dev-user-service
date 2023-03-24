// routes/passenger
const { authenticate, authorize } = require("../controllers/AuthController");
const { updateProfile, savePassengerPreferences, listPassengerPreferences, saveFavouritePlace, 
  removeFavouritePlace, listFavouritePlaces, listConnectableDrivers, filterConnectableDrivers, 
  sendConnectRequestById, sendConnectRequestByReferralCode, rejectConnectRequest, connectWithPassenger, 
  getConnectedDriverDetail, listConnectRequests, listConnectedPassengers } = require("../controllers/PassengerController");

const router = require('express').Router();

// individual passenger routes
// /passenger/getNearByDrivers
router.post('/updateProfile', authenticate, authorize('passenger'), updateProfile);

router.post('/savePassengerPreferences', authenticate, authorize("passenger"), savePassengerPreferences);

router.post('/listPassengerPreferences', authenticate, authorize("passenger"), listPassengerPreferences);

router.post('/saveFavouritePlace', authenticate, authorize("passenger"), saveFavouritePlace);

router.post('/removeFavouritePlace', authenticate, authorize("passenger"), removeFavouritePlace);

router.post('/listFavouritePlaces', authenticate, authorize("passenger"), listFavouritePlaces);

router.post('/listConnectableDrivers', authenticate, authorize("passenger"), listConnectableDrivers);

router.post('/filterConnectableDrivers', authenticate, authorize("passenger"), filterConnectableDrivers);

router.post('/sendConnectRequestById', authenticate, authorize("passenger"), sendConnectRequestById);

router.post('/sendConnectRequestByReferralCode', authenticate, authorize("passenger"), sendConnectRequestByReferralCode);

router.post('/rejectConnectRequest', authenticate, authorize("driver"), rejectConnectRequest);

router.post('/connectWithPassenger', authenticate, authorize("driver"), connectWithPassenger);

router.post('/getConnectedDriverDetail', authenticate, authorize("passenger"), getConnectedDriverDetail);

router.post('/listConnectRequests', authenticate, authorize("driver"), listConnectRequests);

router.post('/listConnectedPassengers', authenticate, authorize("driver"), listConnectedPassengers);

module.exports = router;