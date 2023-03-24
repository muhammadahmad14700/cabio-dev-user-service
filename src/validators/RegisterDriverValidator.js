const { validateRequiredFields, throwError } = require('../utils/Common');

module.exports = {

  registerDriver: (data) => {
    let requiredFields = {
      "tmp_driver_id": "Temp Driver Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  },

  sendQRCodeInEmail: (data) => {
    let requiredFields = {
      'driver_id': "Driver ID"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  }
}