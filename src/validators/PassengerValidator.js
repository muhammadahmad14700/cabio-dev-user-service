const { setCountry, validateRequiredFields, throwError } = require('../utils/Common');

module.exports = {

  updateProfile: (data) => {
    let requiredFields = {
      "passenger_id": "passenger Id",
    };
    // check required fields
    let requiredData = validateRequiredFields(data.body, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    let optionalFields = {
      "first_name" : "first name",
      "last_name" : "last name"
    }
    let optionalData = data.body;
    if (optionalData['first_name'] || optionalData['last_name']) {
      requiredData = validateRequiredFields(optionalData, optionalFields);
      if (requiredData.length > 0) {
        throwError(400, "Required data input", requiredData);
      }
    }
  },
  
  savePassengerPreferences: (data) => {
    setCountry(data);
    let requiredFields = {
      "passenger_id": "Passenger Id",
      "preference_key": "Preference Key",
      "preference_value": "Preference Value"
    };
    if (data["preference_key"] === "payment_method" && 
      data["preference_value"] === "card") {
      let otherRequiredFields = {
        "payment_method_id": "Payment Method Id"
      };
      requiredFields = { ...requiredFields, ...otherRequiredFields };
    }
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    let validationErrors = [];
    if (!["service_id", 'payment_method'].includes(data["preference_key"])) {
      validationErrors.push({
        key: "preference_key",
        msg: "Preference Key is invalid"
      });
    }
    if ((data["preference_key"] === "payment_method") &&
      !(["cash", "wallet", "card"].includes(data["preference_value"]))) {
      validationErrors.push({
        key: "preference_value",
        msg: "Preference Value is invalid"
      });
    }
    if (validationErrors.length > 0) {
      throwError(400, "Validation Errors", validationErrors);
    }
  },

  listPassengerPreferences: (data) => {
    setCountry(data);
    let requiredFields = {
      "passenger_id": "Passenger Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  saveFavouritePlace: (data) => {
    let requiredFields = {
      "passenger_id": "Passenger Id",
      "place": "Place"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    requiredFields = {
      "label": "place.label",
      "type": "place.type",
      "location": "place.location",
      "address": "place.address"
    }
    requiredData = validateRequiredFields(data["place"], requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    requiredFields = {
      "longitude": "place.location.longitude",
      "latitude": "place.location.latitude"
    }
    requiredData = validateRequiredFields(data["place"]["location"], requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    let validationErrors = [];
    if (!(["home", "work", "other"].includes(data["place"]["type"]))) {
      validationErrors.push({
        key: "place.type",
        msg: "place.type is invalid"
      });
    }
    if (validationErrors.length > 0) {
      throwError(400, "Validation Errors", validationErrors);
    }
  },

  removeFavouritePlace: (data) => {
    let requiredFields = {
      "passenger_id": "Passenger Id",
      "place_id": "Place Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  listFavouritePlaces: (data) => {
    let requiredFields = {
      "passenger_id": "Passenger Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  listConnectableDrivers: (data) => {
    setCountry(data);
    let requiredFields = {};
    let optionalFields = { 
      "step": "Step",
      "limit": "Limit",
      "created": "Created"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    let validationErrors = [];
    if (data["step"] && !(["next", 'previous'].includes(data["step"]))) {
      validationErrors.push({
        key: "Step",
        msg: "Step value is invalid"
      });
    }
    if (validationErrors.length > 0) {
      throwError(400, "Validation Errors", validationErrors);
    }
  },

  filterConnectableDrivers: (data) => {
    setCountry(data);
    let requiredFields = {
      "company_name_regex": "Company Name Regex"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  sendConnectRequestById: (data) => {
    let requiredFields = {
      "passenger_id": "Passenger Id",
      "driver_id": "Driver Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  sendConnectRequestByReferralCode: (data) => {
    let requiredFields = {
      "passenger_id": "Passenger Id",
      "referral_code": "Referral Code"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  rejectConnectRequest: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id",
      "passenger_id": "Passenger Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  connectWithPassenger: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id",
      "passenger_id": "Passenger Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  getConnectedDriverDetail: (data) => {
    let requiredFields = {
      "passenger_id": "Passenger Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  listConnectRequests: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id"
    };
    let optionalFields = { 
      "step": "Step",
      "limit": "Limit",
      "created": "Created"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    let validationErrors = [];
    if (data["step"] && !(["next", 'previous'].includes(data["step"]))) {
      validationErrors.push({
        key: "Step",
        msg: "Step value is invalid"
      });
    }
    if (validationErrors.length > 0) {
      throwError(400, "Validation Errors", validationErrors);
    }
  },

  listConnectedPassengers: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id"
    };
    let optionalFields = { 
      "step": "Step",
      "limit": "Limit",
      "created": "Created"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    let validationErrors = [];
    if (data["step"] && !(["next", 'previous'].includes(data["step"]))) {
      validationErrors.push({
        key: "Step",
        msg: "Step value is invalid"
      });
    }
    if (validationErrors.length > 0) {
      throwError(400, "Validation Errors", validationErrors);
    }
  }
}