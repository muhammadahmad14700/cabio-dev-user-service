const { getCountry, throwError } = require("../utils/Common");
const { admin, db } = require("../config/firebase-admin");

class RegisterPassengerDAO {

  async verifyPassenger(data) {
    let tmpPassengerSnapshot = await db.collection("tmp_passengers")
      .where('number', '==', data["phone_number"])
      .limit(1)
      .get();
    if (tmpPassengerSnapshot.empty) {
      throwError(412, "Passenger is not verified yet");
    }
    let tmpPassenger = tmpPassengerSnapshot.docs[0];
    if (tmpPassenger.get('status') == "unverified") {
      throwError(412, "Passenger is not verified yet");
    }
    else if (tmpPassenger.get('status') == "completed") {
      throwError(409, "Passenger is already registered");
    }
    else {
      if (tmpPassenger.get('device_id') !== data['device_id'] || 
        tmpPassenger.get('user_ip') !== data['user_ip']) {
        throwError(417, "Passenger Registration Failed");
      }
      return tmpPassenger.id;
    }
  }

  async registerPassenger(data) {
    let batch = db.batch();
    let passengerRef = db.collection("passengers").doc(data.id);
    let passengerStatsRef = await db.collection(`passengers/${data.id}/stats`).doc(data.id);
    batch.set(passengerRef, {
      id: data.id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password,
      profile_image_url: "",
      coordinates: new admin.firestore.GeoPoint(0, 0),
      balance: 300.0,
      currency: getCountry(data.country).currencyCode,
      country: data.country,
      number: data.phoneNumber,
      connected_driver_id: "",
      fcm_token: "",
      referral_code: data.referralCode,
      total_rides: 0,
      can_take_ride: true,
      language: "en",
      rating: 5.0,
      is_new: true,
      device_id: data.deviceId,
      created: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        service_id: getCountry(data.country).defaultServiceId,
        payment_method: "",
        payment_method_id: ""
      }
    });
    batch.set(passengerStatsRef, {
      total_ratings: 0 
    });
    await batch.commit();
  }

  async deleteTempPassenger(tmpPassengerId) {
    await db.collection("tmp_passengers").doc(tmpPassengerId).delete();
  }

}

module.exports = RegisterPassengerDAO;
