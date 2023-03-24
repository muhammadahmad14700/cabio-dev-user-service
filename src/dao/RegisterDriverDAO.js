const { admin, db } = require("../config/firebase-admin");
const { DEFAULT_COUNTRY, DEFAULT_DRIVER_RADIUS } = require('../constants/DefaultConstants');
const { getCountry, validateRequiredFields, throwError } = require("../utils/Common");

class RegisterDriverDAO {

  constructor() {
    this.registrationAttributes = {
      date_of_birth: "Date of Birth",
      street_number: "Street Number",
      street_name: "Street Number",
      postal_code: "Postal Code",
      cnic_number: "CNIC Number",
      driver_license_number: "Driver License Number",
      driver_license_expiry_date: "Driver License Expiry Date",
      vehicle_registration_number: "Vehicle Registration Number",
      license_plate: "License Plate",
      manufacturer: "Manufacturer",
      model: "Model",
      model_year: "Model Year"
    }
  }

  async verifyDriver(data) {
    let tmpDriver = await db.collection("tmp_drivers").doc(data["tmp_driver_id"]).get();
    if (!tmpDriver || ['unverified', 'verified'].includes(tmpDriver.get('status'))) {
      throwError(412, "Driver Registration is not completed");
    }
    else if (tmpDriver.get('status') == "completed") {
      throwError(412, "Driver is not approved yet");
    }
    let requiredData = validateRequiredFields(tmpDriver.get('post_registration'), 
      this.registrationAttributes);
    if (requiredData.length > 0) {
      throwError(400, "Required data input", requiredData);
    }
    // validate fields
    let validationErrors = [];
    let countryRegex = new RegExp(/^\d{5}-\d{7}-\d$/);
    if (!countryRegex.test(tmpDriver.get('post_registration').cnic_number)) {
      validationErrors.push({
        key: "cnic_number",
        msg: "CNIC Number is invalid"
      });
    }
    let [isCNICDuplicate, 
      isLicenseNumberDuplicate, 
      isVehicleRegNumberDuplicate, 
      isLicensePlateDuplicate] = await Promise.all([
      this.isAttributeValueAlreadyExists('cnic_number', 
        tmpDriver.get('post_registration').cnic_number),
      this.isAttributeValueAlreadyExists('driver_license_number', 
        tmpDriver.get('post_registration').driver_license_number),
      this.isAttributeValueAlreadyExists('vehicle_registration_number', 
        tmpDriver.get('post_registration').vehicle_registration_number),
      this.isAttributeValueAlreadyExists('license_plate', 
        tmpDriver.get('post_registration').license_plate),
    ]);
    if (isCNICDuplicate) {
      validationErrors.push({
        key: "cnic_number",
        msg: "CNIC Number is duplicate"
      });
    }
    if (isLicenseNumberDuplicate) {
      validationErrors.push({
        key: "driver_license_number",
        msg: "Driver License Number is duplicate"
      });
    }
    if (isVehicleRegNumberDuplicate) {
      validationErrors.push({
        key: "vehicle_registration_number",
        msg: "Vehicle Registration Number is duplicate"
      });
    }
    if (isLicensePlateDuplicate) {
      validationErrors.push({
        key: "license_plate",
        msg: "License Plate is duplicate"
      });
    }
    if (validationErrors.length > 0) {
      throwError(400, "Validation Errors", validationErrors);
    }
    return tmpDriver;
  }

  async registerDriver(data) {
    let batch = db.batch();
    let driverRef = await db.collection("drivers").doc(data.id);
    let driverStatsRef = await db.collection(`drivers/${data.id}/stats`).doc(data.id);
    batch.set(driverRef, {
      id: data.id,
      first_name: data.registration.basic_details.first_name,
      last_name: data.registration.basic_details.last_name,
      email: data.registration.basic_details.email,
      password: data.registration.basic_details.password,
      device_id: "",
      number: data.phoneNumber,
      rating: 5.0,
      coordinates: new admin.firestore.GeoPoint(0, 0),
      balance: 0.0,
      extra_balance: 0.0,
      stripe_customer_id: "",
      currency: getCountry(DEFAULT_COUNTRY).currencyCode,
      country: DEFAULT_COUNTRY.name,
      city: data.registration.basic_details.city,
      street_number: data.postRegistration.street_number,
      street_name: data.postRegistration.street_name,
      postal_code: data.postRegistration.postal_code,
      fcm_token: "",
      referral_code: data.referralCode,
      total_rides: 0,
      company: "",
      service_id: data.registration.service_id,
      online: false,
      on_ride: false,
      can_take_ride: true,
      status: "free",
      cnic_front_image_url: data.registration.cnic_front_image_url,
      cnic_back_image_url: data.registration.cnic_back_image_url,
      driver_license_front_image_url: data.registration.driver_license_front_image_url,
      vehicle_reg_book_image_url: data.registration.vehicle_reg_book_image_url,
      profile_image_url: data.registration.profile_image_url,
      date_of_birth: admin.firestore.Timestamp.fromDate(data.postRegistration.date_of_birth.toDate()),
      cnic_number: data.postRegistration.cnic_number,
      driver_license_number: data.postRegistration.driver_license_number,
      driver_license_expiry_date: admin.firestore.Timestamp.fromDate(data.postRegistration.driver_license_expiry_date.toDate()),
      vehicle_registration_number: data.postRegistration.vehicle_registration_number,
      license_plate: data.postRegistration.license_plate,
      manufacturer: data.postRegistration.manufacturer,
      model: data.postRegistration.model,
      model_year: data.postRegistration.model_year,
      created: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        radius: DEFAULT_DRIVER_RADIUS, 
        payment_method_id: ""
      }
    });
    batch.set(driverStatsRef, {
      total_revenue: 0.0,
      total_commission: 0.0,
      total_rides: 0,
      total_cancelled_rides: 0,
      total_ratings: 0 
    });
    await batch.commit();
  }

  async getDriver(driverId) {
    let driver = await db.collection("drivers").doc(driverId).get();
    if (!driver.exists) throwError(404, "Driver not found");
    return driver;
  }

  async isAttributeValueAlreadyExists(attributeKey, attributeValue) {
    let snapshot = await db.collection("drivers")
      .where(attributeKey, "==", attributeValue)
      .limit(1)
      .get();
    if (snapshot.size > 0) return true;
    return false;
  }

  async deleteTempDriver(tmpDriverId) {
    await db.collection("tmp_drivers").doc(tmpDriverId).delete();
  }
}

module.exports = RegisterDriverDAO;
