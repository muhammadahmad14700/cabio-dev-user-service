const { capitalizeEachWord, toFloat, throwError } = require('../utils/Common');
const { notifyDriverAboutDriverConnectRequest, notifyDriverAboutDriverConnection
  } = require('../utils/NotificationUtils');
const { admin, db } = require('../config/firebase-admin');
const { uploadImageToBucket } = require("../utils/imageUploadUtils");
const { updateDriverInES, getDailyStatsId } = require("../utils/DriverUtils");

class DriverDAO {
  async updateProfile(data, file) {
    let isFullNameUpdated = false;
    let updatedData = {};
    let driverRef = db.collection("drivers").doc(data["driver_id"]);
    let driver = await driverRef.get();
    if (!driver.exists) throwError(404, "Driver not found");
    if (file)
      updatedData.profile_image_url = await uploadImageToBucket(
        file,
        "drivers/profile_images"
      );
    if (data["first_name"] && data["last_name"]) {
      isFullNameUpdated = true;
      updatedData.first_name = capitalizeEachWord(data["first_name"]);
      updatedData.last_name = capitalizeEachWord(data["last_name"]);
    }
    await driverRef.update(updatedData);
    // update ES document
    // updatedData.profile_image_url = undefined;
    // if (isFullNameUpdated) updateDriverInES(driver.id, updatedData);
  }

  async getDriverDailyStats(data) {
    let driver = await db.collection("drivers").doc(data["driver_id"]).get();
    if (!driver.exists) throwError(404, "Driver not found");
    let statsId = getDailyStatsId();
    let driverDailyStats = await db.collection(`drivers/${data["driver_id"]}/daily_stats`).doc(statsId).get();
    if (!driverDailyStats.exists) throwError(400, "Driver daily stats document not found");
    let statsData = {};
    let hours = driverDailyStats.get("working_hours").online_hours;
    let minute = (parseFloat(hours * 60) > 1) ? parseInt(hours * 60): parseFloat(hours * 60);
    let h = parseInt(minute/60)
    let m = parseInt(minute - (h * 60))
    statsData.onlineHours = `${h}h ${m}m`;
    statsData.distance = driverDailyStats.get("kms_travelled")
    statsData.trips = driverDailyStats.get("trips")
    statsData.amount = driverDailyStats.get("amount")
    return statsData;
  }

  async updateDriverRadius(data) {
    let radius =  toFloat(data["radius"], 'radius');
    let driverRef = db.collection('drivers').doc(data['driver_id']);
    let driver = await driverRef.get();
    if (!driver.exists) throwError(404, "Driver not found");
    await driverRef.update({
      "preferences.radius": radius
    });
  }

  async sendConnectRequestById(data) {
    if (data["driver_id"] === data["parent_driver_id"]) {
      throwError(409, "You cannot send connect request to yourself");
    }
    let driverRef = db.collection("drivers").doc(data["driver_id"]);
    let parentDriverRef = db
      .collection("drivers")
      .doc(data["parent_driver_id"]);
    let requestSnapshotRef = db
      .collection("drivers_request")
      .where("driver_id", "==", data["driver_id"])
      .where("connected_driver_id", "==", data["parent_driver_id"])
      .where("status", "in", ["pending", "connected"])
      .limit(1);
    let [driver, parentDriver, requestSnapshot] = await Promise.all([
      driverRef.get(),
      parentDriverRef.get(),
      requestSnapshotRef.get(),
    ]);
    if (!driver.exists) throwError(404, "Driver not found");
    if (!parentDriver.exists) throwError(404, "Parent Driver not found");
    if (driver.get('country') !== parentDriver.get('country')) throwError(409, "Both Driver must belong to same country");
    if (!requestSnapshot.empty) {
      if (requestSnapshot.docs[0].get("status") === "pending")
        return parentDriver.get("first_name");
      else throwError(409, "You are already connected with this driver");
    }
    let driverRequestRef = db.collection("drivers_request").doc();
    driverRequestRef.set({
      id: driverRequestRef.id,
      driver_id: data["driver_id"],
      connected_driver_id: data["parent_driver_id"],
      first_name: driver.get('first_name'),
      last_name: driver.get('last_name'),
      email: driver.get('email'),
      number: driver.get('number'),
      profile_image_url: driver.get("profile_image_url"),
      status: 'pending',
      created: admin.firestore.FieldValue.serverTimestamp()
    });
    // send notification
    notifyDriverAboutDriverConnectRequest(driver, parentDriver);
    return parentDriver.get("first_name");
  }

  async sendConnectRequestByReferralCode(data) {
    let driverRef = db.collection("drivers").doc(data["driver_id"]);
    let parentDriverSnapshotRef = db
      .collection("drivers")
      .where("referral_code", "==", data["referral_code"])
      .select(...["id", "first_name", "language", "fcm_token", "country"])
      .limit(1);
    let [driver, parentDriverSnapshot] = await Promise.all([
      driverRef.get(),
      parentDriverSnapshotRef.get(),
    ]);
    if (!driver.exists) throwError(404, "Driver not found");
    if (parentDriverSnapshot.empty) throwError(404, "Parent Driver not found");
    let parentDriver = parentDriverSnapshot.docs[0];
    if (driver.get('country') !== parentDriver.get('country')) throwError(409, "Both Driver must belong to same country");
    if (data["driver_id"] === parentDriver.id) {
      throwError(409, "You cannot send connect request to yourself");
    }
    let requestSnapshot = await db
      .collection("drivers_request")
      .where("driver_id", "==", data["driver_id"])
      .where("connected_driver_id", "==", parentDriver.id)
      .where("status", "in", ["pending", "connected"])
      .limit(1)
      .get();
    if (!requestSnapshot.empty) {
      if (requestSnapshot.docs[0].get("status") === "pending")
        return parentDriver.get("first_name");
      else throwError(409, "You are already connected with this driver");
    }
    let driverRequestRef = db.collection("drivers_request").doc();
    driverRequestRef.set({
      id: driverRequestRef.id,
      driver_id: data["driver_id"],
      connected_driver_id: parentDriver.id,
      first_name: driver.get('first_name'),
      last_name: driver.get('last_name'),
      email: driver.get('email'),
      number: driver.get('number'),
      profile_image_url: driver.get("profile_image_url"),
      status: 'pending',
      created: admin.firestore.FieldValue.serverTimestamp()
    });
    // send notification
    notifyDriverAboutDriverConnectRequest(driver, parentDriver);
    return parentDriver.get("first_name");
  }

  async rejectConnectRequest(data) {
    let requestSnapshot = await db
      .collection("drivers_request")
      .where("driver_id", "==", data["child_driver_id"])
      .where("connected_driver_id", "==", data["driver_id"])
      .where("status", "==", "pending")
      .limit(1)
      .get();
    if (requestSnapshot.empty) throwError(409, "Unable to reject request");
    let request = requestSnapshot.docs[0];
    request.ref.update({
      status: "rejected",
      reject_time: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  async connectWithChildDriver(data) {
    let requestSnapshot = await db
      .collection("drivers_request")
      .where("driver_id", "==", data["child_driver_id"])
      .where("connected_driver_id", "==", data["driver_id"])
      .where("status", "==", "pending")
      .limit(1)
      .get();
    if (requestSnapshot.empty) throwError(409, "Unable to accept request");
    let request = requestSnapshot.docs[0];
    request.ref.update({
      status: "connected",
      connect_time: admin.firestore.FieldValue.serverTimestamp(),
    });
    // send notification
    notifyDriverAboutDriverConnection(
      data["driver_id"],
      data["child_driver_id"]
    );
  }

  async disconnectWithChildDriver(data) {
    let requestSnapshot = await db
      .collection("drivers_request")
      .where("driver_id", "==", data["child_driver_id"])
      .where("connected_driver_id", "==", data["driver_id"])
      .where("status", "==", "connected")
      .limit(1)
      .get();
    if (requestSnapshot.empty) throwError(409, "Unable to remove child driver");
    let request = requestSnapshot.docs[0];
    request.ref.update({
      status: "disconnected",
      disconnect_time: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async listConnectRequests(data) {
    const LIMIT = data["limit"] ? parseInt(data["limit"]) : 10;
    let requests = [],
      requestsSnapshot = null;
    if (!data["step"] || data["step"] === "next") {
      if (data["created"]) {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("connected_driver_id", "==", data["driver_id"])
          .where("status", "==", "pending")
          .orderBy("created")
          .startAfter(new Date(data["created"]))
          .limit(LIMIT)
          .get();
      } else {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("connected_driver_id", "==", data["driver_id"])
          .where("status", "==", "pending")
          .orderBy("created")
          .limit(LIMIT)
          .get();
      }
    } else {
      if (data["created"]) {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("connected_driver_id", "==", data["driver_id"])
          .where("status", "==", "pending")
          .orderBy("created")
          .endBefore(new Date(data["created"]))
          .limitToLast(LIMIT)
          .get();
      } else {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("connected_driver_id", "==", data["driver_id"])
          .where("status", "==", "pending")
          .limitToLast(LIMIT)
          .get();
      }
    }
    if (requestsSnapshot.empty) return requests;
    requestsSnapshot.forEach((request) => {
      requests.push({
        driverId: request.get('driver_id'),
        firstName: request.get('first_name'),
        lastName: request.get('last_name'),
        email: request.get('email'),
        number: request.get('number'),
        profileImageUrl: request.get("profile_image_url"),
        created: request.get('created').toDate()
      });
    });
    return requests;
  }

  async listChildDrivers(data) {
    const LIMIT = 10;
    let drivers = [],
      childDriverIds = [],
      requestsSnapshot = null;
    const requestAttributes = ["driver_id", "created"];
    const driverAttributes = [
      "first_name",
      "last_name",
      "email",
      "number",
      "company",
      "profile_image_url",
    ];
    if (!data["step"] || data["step"] === "next") {
      if (data["created"]) {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("connected_driver_id", "==", data["driver_id"])
          .where("status", "==", "connected")
          .orderBy("created")
          .startAfter(new Date(data["created"]))
          .limit(LIMIT)
          .select(...requestAttributes)
          .get();
      } else {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("connected_driver_id", "==", data["driver_id"])
          .where("status", "==", "connected")
          .orderBy("created")
          .limit(LIMIT)
          .select(...requestAttributes)
          .get();
      }
    } else {
      if (data["created"]) {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("connected_driver_id", "==", data["driver_id"])
          .where("status", "==", "connected")
          .orderBy("created")
          .endBefore(new Date(data["created"]))
          .limitToLast(LIMIT)
          .select(...requestAttributes)
          .get();
      } else {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("connected_driver_id", "==", data["driver_id"])
          .where("status", "==", "connected")
          .limitToLast(LIMIT)
          .select(...requestAttributes)
          .get();
      }
    }
    if (requestsSnapshot.empty) return drivers;
    requestsSnapshot.forEach((request) => {
      childDriverIds.push(request.get("driver_id"));
    });
    let length = requestsSnapshot.size;
    let createdDate = requestsSnapshot.docs[length - 1].get("created").toDate();
    let driversSnapshot = await db
      .collection("drivers")
      .where("id", "in", childDriverIds)
      .select(...driverAttributes)
      .get();
    driversSnapshot.forEach((driver) => {
      drivers.push({
        driverId: driver.id,
        firstName: driver.get("first_name"),
        lastName: driver.get("last_name"),
        email: driver.get("email"),
        number: driver.get("number"),
        company: driver.get("company"),
        profileImageUrl: driver.get("profile_image_url"),
        created: createdDate,
      });
    });
    return drivers;
  }

  async listParentDrivers(data) {
    const LIMIT = 10;
    const requestAttributes = ["connected_driver_id", "created"];
    const driverAttributes = [
      "first_name",
      "last_name",
      "email",
      "number",
      "company",
      "profile_image_url",
    ];
    let drivers = [],
      parentDriverIds = [],
      requestsSnapshot = null;
    if (!data["step"] || data["step"] === "next") {
      if (data["created"]) {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("driver_id", "==", data["driver_id"])
          .where("status", "==", "connected")
          .orderBy("created")
          .startAfter(new Date(data["created"]))
          .limit(LIMIT)
          .select(...requestAttributes)
          .get();
      } else {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("driver_id", "==", data["driver_id"])
          .where("status", "==", "connected")
          .orderBy("created")
          .limit(LIMIT)
          .select(...requestAttributes)
          .get();
      }
    } else {
      if (data["created"]) {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("driver_id", "==", data["driver_id"])
          .where("status", "==", "connected")
          .orderBy("created")
          .endBefore(new Date(data["created"]))
          .limitToLast(LIMIT)
          .select(...requestAttributes)
          .get();
      } else {
        requestsSnapshot = await db
          .collection("drivers_request")
          .where("driver_id", "==", data["driver_id"])
          .where("status", "==", "connected")
          .limitToLast(LIMIT)
          .select(...requestAttributes)
          .get();
      }
    }
    if (requestsSnapshot.empty) return drivers;
    requestsSnapshot.forEach((request) => {
      parentDriverIds.push(request.get("connected_driver_id"));
    });
    let length = requestsSnapshot.size;
    let createdDate = requestsSnapshot.docs[length - 1].get("created").toDate();
    let driversSnapshot = await db
      .collection("drivers")
      .where("id", "in", parentDriverIds)
      .select(...driverAttributes)
      .get();
    driversSnapshot.forEach((driver) => {
      drivers.push({
        driverId: driver.id,
        firstName: driver.get("first_name"),
        lastName: driver.get("last_name"),
        email: driver.get("email"),
        number: driver.get("number"),
        company: driver.get("company"),
        profileImageUrl: driver.get("profile_image_url"),
        created: createdDate,
      });
    });
    return drivers;
  }
}

module.exports = DriverDAO;