const { validateRequiredFields, throwError } = require('../utils/Common');

module.exports = {

  registerPassenger: (data) => {
    let requiredFields = {
      "first_name": "First Name",
      "last_name": "Last Name",
      "email": "Email",
      "password": "Password",
      "country": "Country",
      "phone_number": "Phone Number",
      "device_id": "Device Id"
    };
    // check required fields
    let requiredData = validateRequiredFields(data, requiredFields);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
  }
}