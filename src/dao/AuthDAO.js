const { db } = require('../config/firebase-admin');
const { throwError } = require('../utils/Common');

class AuthDAO {

  async findUserByEmail(collection, email) {
    let user = await db.collection(collection)
      .where('email', '==', email)
      .limit(1)
      .get();
    if (user.empty) throwError(401, "Credentials Invalid");
    return user.docs[0];
  }

  async findUserAndTypeByEmail(email) {
    let passengerSnapshotRef = await db
      .collection("passengers")
      .where("email", "==", email)
      .select(...["id"])
      .limit(1)
      .get();
    let driverSnapshotRef = await db
      .collection("drivers")
      .where("email", "==", email)
      .select(...["id"])
      .limit(1)
      .get();
    let [passengerSnapshot, driverSnapshot] = await Promise.all([
      passengerSnapshotRef,
      driverSnapshotRef
    ]);
    if (!passengerSnapshot.empty) {
      return {
        user: passengerSnapshot.docs[0],
        userType: "passenger",
      };
    }
    if (!driverSnapshot.empty) {
      return {
        user: driverSnapshot.docs[0],
        userType: "driver",
      };
    }
    throwError(404, "User Email is not registered");
  }

  async findUserAndTypeById(id) {
    let passenger = await db
      .collection("passengers")
      .doc(id)
      .get();
    let driver = await db
      .collection("drivers")
      .doc(id)
      .get();
    if (passenger.exists) {
      return {
        user: passenger,
        userType: "passenger",
      };
    }
    if (driver.exists) {
      return {
        user: driver,
        userType: "driver",
      };
    }
    throwError(404, "User is not registered");
  }

  async updateUserByUserType(user, userType, newData) {
    if (userType == "passenger") {
      await db.collection("passengers").doc(user.id).update(newData);
    } else if (userType == "driver") {
      await db.collection("drivers").doc(user.id).update(newData);
    }
  }

}

module.exports = AuthDAO;
