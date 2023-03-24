const { capitalize, capitalizeEachWord, throwError } = require('../utils/Common');
const { DEFAULT_PAYMENT_METHOD } = require('../constants/DefaultConstants');
const { getAllSearchedDriverIds, updatePassengerInES } = require('../utils/PassengerUtils');
const { admin, db } = require('../config/firebase-admin');
const { notifyDriverAboutPassengerConnectRequest, notifyPassengerAboutPassengerConnection 
  } = require('../utils/NotificationUtils');
const { uploadImageToBucket } = require("../utils/imageUploadUtils");

class PassengerDAO {

  async updateProfile(data, file) {
    let isFullNameUpdated = false;
    let updatedData = {};
    let passengerRef = db.collection("passengers").doc(data["passenger_id"]);
    let passenger = await passengerRef.get();
    if(!passenger.exists) throwError(404, "Passenger not found");
    if (file) updatedData.profile_image_url = await uploadImageToBucket(file, "passengers/profile_images");
    if (data['first_name'] && data['last_name']) {
      isFullNameUpdated = true;
      updatedData.first_name = capitalizeEachWord(data['first_name']);
      updatedData.last_name = capitalizeEachWord(data['last_name']);
    }
    await passengerRef.update(updatedData);
    // update ES document
    // updatedData.profile_image_url = undefined;
    // if (isFullNameUpdated) updatePassengerInES(passenger.id, updatedData);
  }

  async savePassengerPreferences(data) {
    let passengerRef = db.collection("passengers").doc(data["passenger_id"]);
    let updatedPreference = {};
    updatedPreference[["preferences." + data["preference_key"]]] = data["preference_value"];
    if (data["preference_key"] === "payment_method" && data["preference_value"] === "card") {
      updatedPreference["preferences.payment_method_id"] = data["payment_method_id"];
    }
    await passengerRef.update(updatedPreference);
    return await this.getPassengerPreferences(data["_country"], passengerRef);
  }

  async listPassengerPreferences(data) {
    let passengerRef = db.collection("passengers").doc(data["passenger_id"]);
    return await this.getPassengerPreferences(data["_country"], passengerRef);
  }

  async saveFavouritePlace(data) {
    let favouritePlacesCollectionRef = db.collection(`passengers/${data["passenger_id"]}/fav_places`);
    let favouritePlacesSnapshot = await favouritePlacesCollectionRef
      .where('type', '==', data["place"]["type"])
      .get();
    let location = new admin.firestore.GeoPoint(parseFloat(data["place"]["location"]["latitude"]), 
      parseFloat(data["place"]["location"]["longitude"]));
    if (data["place"]["type"] !== "other") {
      if (favouritePlacesSnapshot.empty) {
        await favouritePlacesCollectionRef.add({
          label: capitalize(data["place"]["type"]),
          type: data["place"]["type"],
          location: location,
          address: data["place"]["address"]
        });
      }
      else {
        await favouritePlacesSnapshot.docs[0].ref.update({
          label: capitalize(data["place"]["type"]),
          type: data["place"]["type"],
          location: location,
          address: data["place"]["address"]
        });
      }
    }
    else {
      if (favouritePlacesSnapshot.size == 5) throwError(400, 'Cannot add more than 5 places');
      await favouritePlacesCollectionRef.add({
        label: data["place"]["label"],
        type: data["place"]["type"],
        location: location,
        address: data["place"]["address"]
      });
    }
  }

  async removeFavouritePlace(data) {
    await db.collection(`passengers/${data["passenger_id"]}/fav_places`)
      .doc(data["place_id"])
      .delete();
  }

  async listFavouritePlaces(data) {
    let favouritePlaces = { 
      home: null,
      work: null,
      other: []
    };
    let favouritePlacesSnapshot = await db.collection(`passengers/${data["passenger_id"]}/fav_places`).get();
    if (favouritePlacesSnapshot.empty) return favouritePlaces;
    favouritePlacesSnapshot.forEach(place => {
      let data = {
        id: place.id,
        label: place.get("label"),
        type: place.get("type"),
        location: {
          latitude: place.get("location").latitude,
          longitude: place.get("location").longitude
        },
        address: place.get("address")
      }
      if (place.get('type') !== "other") favouritePlaces[place.get('type')] = data;
      else favouritePlaces.other.push(data);
    });
    return favouritePlaces;
  }

  async listConnectableDrivers(data) {
    const LIMIT = data["limit"] ? parseInt(data["limit"]) : 10;
    const selectFields = ["first_name", "last_name", "company", "profile_image_url", "created"];
    let drivers = [], 
      driversSnapshot = null;
    do {
      if (!data["step"] || data["step"] === "next") {
        if (data["created"]) {
          driversSnapshot = await db.collection("drivers")
            .where('country', '==', data["_country"].name)
            .select(...selectFields)
            .orderBy('created')
            .startAfter(new Date(data["created"]))
            .limit(LIMIT)
            .get();
        }
        else {
          driversSnapshot = await db.collection("drivers")
            .where('country', '==', data["_country"].name)
            .select(...selectFields)
            .orderBy('created')
            .limit(LIMIT)
            .get();
        }
      }
      else {
        if (data["created"]) {
          driversSnapshot = await db.collection("drivers")
            .where('country', '==', data["_country"].name)
            .select(...selectFields)
            .orderBy('created')
            .endBefore(new Date(data["created"]))
            .limitToLast(LIMIT)
            .get();
        }
        else {
          driversSnapshot = await db.collection("drivers")
            .where('country', '==', data["_country"].name)
            .select(...selectFields)
            .orderBy('created')
            .limitToLast(LIMIT)
            .get();
        }
      }
      driversSnapshot.forEach(driver => {
        if (driver.get('company')) {
          drivers.push({
            id: driver.id,
            first_name: driver.get('first_name'),
            last_name: driver.get('last_name'),
            company: driver.get('company'),
            profileImageUrl: driver.get('profile_image_url'),
            created: driver.get('created').toDate()
          });
        }
      });
      // set created date of last document to use in case of next step
      // or created date of first document in case of previous step
      if (!data["step"] || data["step"] === "next") {
        if (driversSnapshot.size) data["created"] = driversSnapshot.docs[driversSnapshot.size - 1].get('created').toDate();
      }
      else {
        if (driversSnapshot.size) data["created"] = driversSnapshot.docs[0].get('created').toDate();
      }
    }
    while (driversSnapshot.size && !drivers.length);
    return drivers;
  }

  async filterConnectableDrivers(data) {
    let driversSnapshot = null, driverIdsArrays = [], drivers = [];
    let selectAttributes = ["id", "first_name", "last_name", "company", "profile_image_url"];
    let textSearch = data["company_name_regex"] ? data["company_name_regex"] : "";
    let driverIds = await getAllSearchedDriverIds(textSearch, data["_country"].name);
    while (driverIds.length > 0) {
      driverIdsArrays.push(driverIds.splice(0, 10));
    }
    for (let i = 0; i < driverIdsArrays.length; i++) {
      driversSnapshot = await db.collection("drivers")
        .where("id", "in", driverIdsArrays[i])
        .select(...selectAttributes)
        .get();
      driversSnapshot.forEach(driver => {
        drivers.push({
          id: driver.id,
          first_name: driver.get('first_name'),
          last_name: driver.get('last_name'),
          company: driver.get('company'),
          profileImageUrl: driver.get('profile_image_url')
        });
      });
    }
    return drivers;
  }

  async sendConnectRequestById(data) {
    let passenger = await db.collection("passengers")
      .doc(data["passenger_id"])
      .get();
    if (!passenger.exists) throwError(404, "Passenger not found");
    if (passenger.get('connected_driver_id') === data["driver_id"]) {
      throwError(409, "You are already connected with this company")
    }
    let passengerRequestRef = db.collection("passengers_request").doc(data["passenger_id"]);
    passengerRequestRef.set({
      id: passengerRequestRef.id,
      connected_driver_id: data["driver_id"],
      first_name: passenger.get('first_name'),
      last_name: passenger.get('last_name'),
      email: passenger.get('email'),
      number: passenger.get('number'),
      profileImageUrl: passenger.get('profile_image_url'),
      status: 'pending',
      created: admin.firestore.FieldValue.serverTimestamp()
    });
    // send notification
    notifyDriverAboutPassengerConnectRequest(passenger, data["driver_id"], 'id');
  }

  async sendConnectRequestByReferralCode(data) {
    let passengerRef = db.collection("passengers").doc(data["passenger_id"]);
    let driverSnapshotRef = db.collection("drivers")
      .where('referral_code', '==', data["referral_code"])
      .select(...['id', 'first_name', 'language', 'fcm_token'])
      .limit(1);
    let [passenger, driverSnapshot] = await Promise.all([ passengerRef.get(), driverSnapshotRef.get()]);
    if (!passenger.exists) throwError(404, "Passenger not found");
    if (driverSnapshot.empty) throwError(404, "Driver not found");
    let driver = driverSnapshot.docs[0];
    if (passenger.get('connected_driver_id') === driver.id) {
      throwError(409, "You are already connected with this company")
    }
    let passengerRequestRef = db.collection("passengers_request").doc(data["passenger_id"]);
    await passengerRequestRef.set({
      id: passengerRequestRef.id,
      connected_driver_id: driver.id,
      first_name: passenger.get('first_name'),
      last_name: passenger.get('last_name'),
      email: passenger.get('email'),
      number: passenger.get('number'),
      profileImageUrl: passenger.get('profile_image_url'),
      status: 'pending',
      created: admin.firestore.FieldValue.serverTimestamp()
    });
    // send notification
    notifyDriverAboutPassengerConnectRequest(passenger, driver);
    return driver.get('first_name');
  }

  async rejectConnectRequest(data) {
    let passengerRef = db.collection("passengers").doc(data["passenger_id"]);
    let passengerRequestSnapshotRef = db.collection("passengers_request")
      .where('id', '==', data["passenger_id"])
      .where('connected_driver_id', '==', data["driver_id"])
      .where('status', '==', 'pending')
      .limit(1);
    let [passenger, passengerRequestSnapshot] = await Promise.all([ passengerRef.get(), passengerRequestSnapshotRef.get()]);
    if (!passenger.exists) throwError(404, "Passenger not found");
    // It can occur if already connected driver tries to reject the request, in case of ui not updated
    if (passenger.get('connected_driver_id') === data["driver_id"]) {
      throwError(409, "Unable to reject request")
    }
    // In case of already rejected or In case of no request found against connected driver due to overriding
    if (passengerRequestSnapshot.empty) throwError(409, "Unable to reject request");
    let passengerRequest = passengerRequestSnapshot.docs[0];
    passengerRequest.ref.update({
      status: 'rejected',
      reject_time: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  async connectWithPassenger(data) {
    // perform transaction
    await db.runTransaction(async t => {
      let passengerRef = db.collection("passengers").doc(data["passenger_id"]);
      let passengerRequestSnapshotRef = db.collection("passengers_request")
        .where('id', '==', data["passenger_id"])
        .where('connected_driver_id', '==', data["driver_id"])
        .where('status', '==', 'pending')
        .limit(1);
      let [passenger, passengerRequestSnapshot] = await Promise.all([passengerRef.get(), passengerRequestSnapshotRef.get()]);
      if (!passenger.exists) throwError(404, "Passenger not found");
      // It can occur if already connected driver tries to connect with passenger, in case of ui not updated
      if (passenger.get('connected_driver_id') === data["driver_id"]) {
        throwError(409, "Unable to connect with passenger");
      }
      // In case of already reject or In case of no request found against connected driver due to overriding
      if (passengerRequestSnapshot.empty) throwError(409, "Unable to connect with passenger");
      let passengerRequest = passengerRequestSnapshot.docs[0];
      t.update(passengerRef, {
        connected_driver_id: data["driver_id"]
      });
      t.update(passengerRequest.ref,{
        status: 'connected',
        connect_time: admin.firestore.FieldValue.serverTimestamp()
      });
      // send notification
      notifyPassengerAboutPassengerConnection(data["driver_id"], passenger);
      return Promise.resolve("success");
    });
    return;
  }

  async getConnectedDriverDetail(data) {
    let passenger = await db.collection("passengers").doc(data["passenger_id"]).get();
    if (!passenger.exists) throwError(404, "Passenger not found");
    let connectedDriverId = passenger.get('connected_driver_id');
    if (!connectedDriverId) return null;
    let driver = await db.collection('drivers').doc(connectedDriverId).get();
    // if connected driver is deleted accidently
    if (!driver.exists) return null;
    return {
      id: driver.id,
      firstName: driver.get('first_name'),
      lastName: driver.get('last_name'),
      email: driver.get('email'),
      number: driver.get('number'),
      company: driver.get('company'),
      profileImageUrl: driver.get('profile_image_url'),
      manufacturer: driver.get('manufacturer'),
      licensePlate: driver.get('license_plate'),
      vehicleRegistrationNumber: driver.get('vehicle_registration_number')
    }
  }

  async listConnectRequests(data) {
    const LIMIT = data["limit"] ? parseInt(data["limit"]) : 10;
    let requests = [], 
      requestsSnapshot = null;
    if (!data["step"] || data["step"] === "next") {
      if (data["created"]) {
        requestsSnapshot = await db.collection("passengers_request")
          .where('connected_driver_id', '==', data["driver_id"])
          .where('status', '==', 'pending')
          .orderBy('created')
          .startAfter(new Date(data["created"]))
          .limit(LIMIT)
          .get();
      }
      else {
        requestsSnapshot = await db.collection("passengers_request")
          .where('connected_driver_id', '==', data["driver_id"])
          .where('status', '==', 'pending')
          .orderBy('created')
          .limit(LIMIT)
          .get();
      }
    }
    else {
      if (data["created"]) {
        requestsSnapshot = await db.collection("passengers_request")
          .where('connected_driver_id', '==', data["driver_id"])
          .where('status', '==', 'pending')
          .orderBy('created')
          .endBefore(new Date(data["created"]))
          .limitToLast(LIMIT)
          .get();
      }
      else {
        requestsSnapshot = await db.collection("passengers_request")
          .where('connected_driver_id', '==', data["driver_id"])
          .where('status', '==', 'pending')
          .limitToLast(LIMIT)
          .get();
      }
    }
    if (requestsSnapshot.empty) return requests;
    requestsSnapshot.forEach(request => {
      requests.push({
        passengerId: request.id,
        firstName: request.get('first_name'),
        lastName: request.get('last_name'),
        email: request.get('email'),
        number: request.get('number'),
        profileImageUrl: request.get('profile_image_url'),
        created: request.get('created').toDate()
      });
    });
    return requests;
  }

  async listConnectedPassengers(data) {
    const LIMIT = data["limit"] ? parseInt(data["limit"]) : 10;
    const passengerAttributes = ["first_name", "last_name", "email", "number", "profile_image_url", "rating", "created"];
    let passengers = [], 
      passengersSnapshot = null;
    if (!data["step"] || data["step"] === "next") {
      if (data["created"]) {
        passengersSnapshot = await db.collection("passengers")
        .where('connected_driver_id', '==', data["driver_id"])
        .orderBy('created')
        .startAfter(new Date(data["created"]))
        .limit(LIMIT)
        .select(...passengerAttributes)
        .get();
      }
      else {
        passengersSnapshot = await db.collection("passengers")
          .where('connected_driver_id', '==', data["driver_id"])
          .orderBy('created')
          .limit(LIMIT)
          .select(...passengerAttributes)
          .get();
      }
    }
    else {
      if (data["created"]) {
        passengersSnapshot = await db.collection("passengers")
          .where('connected_driver_id', '==', data["driver_id"])
          .orderBy('created')
          .endBefore(new Date(data["created"]))
          .limitToLast(LIMIT)
          .select(...passengerAttributes)
          .get();
      }
      else {
        passengersSnapshot = await db.collection("passengers")
          .where('connected_driver_id', '==', data["driver_id"])
          .limitToLast(LIMIT)
          .select(...passengerAttributes)
          .get();
      }
    }
    if (passengersSnapshot.empty) return passengers;
    passengersSnapshot.forEach(passenger => {
      passengers.push({
        passengerId: passenger.id,
        firstName: passenger.get('first_name'),
        lastName: passenger.get('last_name'),
        email: passenger.get('email'),
        number: passenger.get('number'),
        profileImageUrl: passenger.get('profile_image_url'),
        rating: passenger.get('rating'),
        created: passenger.get('created').toDate()
      });
    });
    return passengers;
  }

  async getPassengerPreferences(country, passengerRef) {
    let preferences = {
      service: null,
      paymentMethod: DEFAULT_PAYMENT_METHOD,
      paymentMethodId: "",
    };
    let serviceId = "";
    let servicesSnapshotRef = db.collection("services").where('country', '==', country.name);
    let [passenger, servicesSnapshot] = await Promise.all([
      passengerRef.get(), 
      servicesSnapshotRef.get()
    ]);
    let passengerPreferences = passenger.get('preferences');
    if (passengerPreferences) {
      preferences.paymentMethod = passengerPreferences.payment_method;
      preferences.paymentMethodId = passengerPreferences.payment_method_id;
      serviceId = passengerPreferences.service_id;
    }
    preferences.service = await this.getService(country, passenger, servicesSnapshot, serviceId);
    return preferences;
  }

  async getService(country, passenger, servicesSnapshot, serviceId) {
    let service = servicesSnapshot.docs.find(service => service.id === serviceId);
    if (!service) {
      service = servicesSnapshot.docs.find(service => service.id === country.defaultServiceId);
      if (service) {
        await passenger.ref.update({ 
          "preferences.service_id": country.defaultServiceId,
          "preferences.payment_method": passenger.get('preferences') ? 
            passenger.get('preferences').payment_method : DEFAULT_PAYMENT_METHOD, 
          "preferences.payment_method_id": passenger.get('preferences') ? 
            passenger.get('preferences').payment_method_id : ""
        });
      }
      else throwError(404, "Service not found");
    }
    return {
      id: service.id,
      name: service.get('name'),
      imageUrl: service.get('image_url'),
      seatCapacity: service.get('seat_capacity')
    };
  }
}

module.exports = PassengerDAO;