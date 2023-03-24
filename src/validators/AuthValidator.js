const { validateRequiredFields, throwError } = require('../utils/Common');

module.exports = {

  getTokens: (data) => {
    let requiredFields = {
      "user_type": "User Type",
      "email": "Email",
      "password": "Password"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }

    // check validation
    let validationErrors = {};
    if (!(["passenger", 'driver'].includes(data["user_type"]))) {
      validationErrors.push({
        key: "user_type",
        msg: "User Type is not supported"
      });
    }
    if (validationErrors.length > 0) {
      throwError(400, "Validation Errors", validationErrors);
    }
  },

  refreshToken: (data) => {
    let requiredFields = {
      "refresh_token": "Refresh Token"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  registerUser: (data) => {
    let requiredFields = {
      "email": "Email",
      "password": "Password"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  updateUserEmail: (data) => {
    let requiredFields = {
      "user_email": "User Email",
      "new_email": "New Email"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  updateUserPassword: (data) => {
    let requiredFields = {
      "user_email": "User Email",
      "new_password": "New Password"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  updateUserPasswordById: (data) => {
    let requiredFields = {
      "user_id": "User Id",
      "old_password": "Old Password",
      "new_password": "New Password",
      "confirm_password": "Confirm Password",
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },
}