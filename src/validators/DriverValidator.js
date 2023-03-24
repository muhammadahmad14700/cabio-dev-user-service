const { validateRequiredFields, throwError } = require('../utils/Common');

module.exports = {

  updateProfile : (data) =>{
    let requiredFields = {
      "driver_id": "Driver Id",
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

  getDriverDailyStats : (data) => {
    let requiredFields = {
      "driver_id": "Driver Id",
    }
    //check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData)
    }
  }, 
  
  updateDriverRadius: (data) => {
    let requiredFields = {
      driver_id: "Driver Id",
      radius: "Radius"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  sendConnectRequestById: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id",
      "parent_driver_id": "Parent Driver Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  sendConnectRequestByReferralCode: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id",
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
      "child_driver_id": "Child Driver Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  connectWithChildDriver: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id",
      "child_driver_id": "Child Driver Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  disconnectWithChildDriver: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id",
      "child_driver_id": "Child Driver Id"
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

  listChildDrivers: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id"
    };
    let optionalFields = { 
      "step": "Step",
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

  listParentDrivers: (data) => {
    let requiredFields = {
      "driver_id": "Driver Id"
    };
    let optionalFields = { 
      "step": "Step",
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