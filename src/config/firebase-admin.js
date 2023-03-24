const admin = require("firebase-admin");

const serviceAccount = require("../private/service-account.json");

// initialize admin-sdk
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: ""
});

// initialize firestore
let db = admin.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

module.exports = { admin, db };
