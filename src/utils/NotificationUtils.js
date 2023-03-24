const { admin, db } = require('../config/firebase-admin');
const { capitalize, getLanguage, throwError } = require('../utils/Common');

const transliterals = {
  en: {
    newRequest: "New Request",
    driverConnectRequest: "sent you a driver connect request",
    requestAccepted: "Request Accepted",
    driverAcceptRequest: "has accepted your request",
    passengerConnectRequest: "sent you a passenger connect request",
    newConnection: "New Connection",
    employedDriverConnection: "has become your employed driver",
    disconnectConnection: "Disconnect Connection",
    employedDriverDisconnection: "has disconnected with you"
  },
  es: {
    newRequest: "Nueva solicitud",
    driverConnectRequest: "Le envió una solicitud de conexión de conductor",
    requestAccepted: "Solicitud aceptada",
    driverAcceptRequest: "ha aceptado tu solicitud",
    passengerConnectRequest: "Le envió una solicitud de conexión de pasajero",
    newConnection: "Nueva conexión",
    employedDriverConnection: "se ha convertido en su conductor empleado",
    disconnectConnection: "Desconectar conexión",
    employedDriverDisconnection: "se ha desconectado contigo"
  },
  ca: {
    newRequest: "Nova sol•licitud",
    driverConnectRequest: "Li va enviar una sol•licitud de connexió de controlador",
    requestAccepted: "Sol•licitud acceptada",
    driverAcceptRequest: "ha acceptat la teva sol•licitud",
    passengerConnectRequest: "Enviar una sol·licitud de connexió de passatge",
    newConnection: "Nova connexió",
    employedDriverConnection: "s'ha convertit en el vostre conductor empleat",
    disconnectConnection: "Desconnecteu la connexió",
    employedDriverDisconnection: "s'ha desconnectat amb tu"
  },
  nl: {
    newRequest: "Nieuw verzoek",
    driverConnectRequest: "stuurde u een stuurprogramma-verbindingsverzoek",
    requestAccepted: "Verzoek geaccepteerd",
    driverAcceptRequest: "heeft uw verzoek geaccepteerd",
    passengerConnectRequest: "stuurde u een passagiersverbindingsverzoek",
    newConnection: "Nieuwe verbinding",
    employedDriverConnection: "is uw chauffeur in loondienst geworden",
    disconnectConnection: "Verbinding verbreken",
    employedDriverDisconnection: "heeft de verbinding met jou verbroken"
  },
  de: {
    newRequest: "Neue Anfrage",
    driverConnectRequest: "hat Ihnen eine Treiberverbindungsanforderung gesendet",
    requestAccepted: "Anfrage akzeptiert",
    driverAcceptRequest: "hat Ihre Anfrage angenommen",
    passengerConnectRequest: "hat Ihnen eine Passagierverbindungsanfrage gesendet",
    newConnection: "Neue Verbindung",
    employedDriverConnection: "ist Ihr angestellter Fahrer geworden",
    disconnectConnection: "Verbindung trennen",
    employedDriverDisconnection: "hat sich mit dir getrennt"
  },
};

const notifyDriverAboutDriverConnectRequest = async (driver, parentDriver) => {
  try {
    let lang = getLanguage(parentDriver.get('language'));
    let notificationData = {
      type: 'driverRequest',
      userType: 'driver',
      userId: parentDriver.get('id'),
      requestByType: 'driver',
      requestById: driver.get('id')
    };
    let notificationMessage = {
      title: transliterals[lang]["newRequest"],
      body: capitalize(driver.get('first_name')) + " " + 
        transliterals[lang]["driverConnectRequest"],
      clickAction: "newRequest",
      data: { type: "request" },
      fcmToken: parentDriver.get('fcm_token')
    };
    await sendNotification(notificationData, notificationMessage);
  }
  catch(e) { console.error(e) }
}

const notifyDriverAboutDriverConnection = async (parentDriverId, driverId) => {
  try {
    let parentDriver = await db.collection("drivers").doc(parentDriverId).get();
    let driver = await db.collection("drivers").doc(driverId).get();
    if (!parentDriver.exists || !driver.exists) throwError(404, "Driver not found");
    let lang = getLanguage(driver.get('language'));
    let notificationData = {
      type: 'notification',
      userType: 'driver',
      userId: driver.get('id'),
      requestByType: 'driver',
      requestById: parentDriver.get('id')
    };
    let notificationMessage = {
      title: transliterals[lang]["requestAccepted"],
      body: capitalize(parentDriver.get('first_name')) + " " + 
        transliterals[lang]["driverAcceptRequest"],
      clickAction: "one.qairos.StaticNotificationActivity",
      data: { type: "request" },
      fcmToken: driver.get('fcm_token')
    };
    await sendNotification(notificationData, notificationMessage);
  }
  catch(e) { console.error(e) }
}

const notifyDriverAboutPassengerConnectRequest = async (passenger, driverParam, driverParamType = null) => {
  try {
    let driver = null;
    if (driverParamType === "id") {
      driver = await db.collection("drivers").doc(driverParam).get();
    }
    else driver = driverParam;
    if (!driver.exists) throwError(404, "Driver not found");
    let lang = getLanguage(driver.get('language'));
    let notificationData = {
      type: 'passengerRequest',
      userType: 'driver',
      userId: driver.get('id'),
      requestByType: 'passenger',
      requestById: passenger.get('id')
    };
    let notificationMessage = {
      title: transliterals[lang]["newRequest"],
      body: capitalize(passenger.get('first_name')) + " " + 
        transliterals[lang]["passengerConnectRequest"],
      clickAction: "newRequest",
      data: { type: "request" },
      fcmToken: driver.get('fcm_token')
    };
    await sendNotification(notificationData, notificationMessage);
  }
  catch(e) { console.error(e) }
}

const notifyPassengerAboutPassengerConnection = async (driverId, passenger) => {
  try {
    let driver = await db.collection("drivers").doc(driverId).get();
    if (!driver.exists) throwError(404, "Driver not found");
    let lang = getLanguage(passenger.get('language'));
    let notificationData = {
      type: 'notification',
      userType: 'passenger',
      userId: passenger.get('id'),
      requestByType: 'driver',
      requestById: driver.get('id')
    };
    let notificationMessage = {
      title: transliterals[lang]["requestAccepted"],
      body: capitalize(driver.get('first_name')) + " " + 
        transliterals[lang]["driverAcceptRequest"],
      clickAction: "newRequest",
      data: { type: "request" },
      fcmToken: passenger.get('fcm_token')
    };
    await sendNotification(notificationData, notificationMessage);
  }
  catch(e) { console.error(e) }
}

const notifyDriverAboutEmployedDriverConnection = async (parentDriver, employedDriverParam, 
  employedDriverParamType = null) => {
  try {
    let employedDriver = null;
    if (employedDriverParamType === "id") {
      employedDriver = await db.collection("drivers").doc(employedDriverParam).get();
    }
    else employedDriver = employedDriverParam;
    if (!employedDriver.exists) throwError(404, "Driver not found");
    let lang = getLanguage(parentDriver.get('language'));
    let notificationData = {
      type: 'newConnection',
      userType: 'driver',
      userId: parentDriver.get('id'),
      requestByType: 'driver',
      requestById: employedDriver.get('id'),
    };
    let notificationMessage = {
      title: transliterals[lang]["newConnection"],
      body: capitalize(employedDriver.get("first_name")) + " " + 
        transliterals[lang]["employedDriverConnection"],
      clickAction: "newConnection",
      data: { type: "" },
      fcmToken: parentDriver.get('fcm_token')
    };
    await sendNotification(notificationData, notificationMessage);
  }
  catch(e) { console.error(e) }
}

const notifyDriverAboutEmployedDriverDisconnection = async (parentDriverId, employedDriverId) => {
  try {
    let parentDriverRef = db.collection('drivers').doc(parentDriverId);
    let employedDriverRef = db.collection('drivers').doc(employedDriverId);
    let [parentDriver, employedDriver] = await Promise.all([parentDriverRef.get(), employedDriverRef.get()]);
    if (!parentDriver.exists || !employedDriver.exists) throwError(404, "Driver not found");
    let lang = getLanguage(parentDriver.get('language'));
    let notificationData = {
      type: 'disconnectConnection',
      userType: 'driver',
      userId: parentDriver.get('id'),
      requestByType: 'driver',
      requestById: employedDriver.get('id'),
    };
    let notificationMessage = {
      title: transliterals[lang]["disconnectConnection"],
      body: capitalize(employedDriver.get("first_name")) + " " + 
        transliterals[lang]["employedDriverDisconnection"],
      clickAction: "disconnectConnection",
      data: { type: "" },
      fcmToken: parentDriver.get('fcm_token')
    };
    await sendNotification(notificationData, notificationMessage);
  }
  catch(e) { console.error(e) }
}

const sendNotification = async (notificationData, notificationMessage) => {
  let notificationRef = db.collection('notifications').doc();
  let refId = notificationRef.id;
  let data = {
    id: refId,
    is_new: true,
    type: notificationData.type,
    user_type: notificationData.userType,
    user_id: notificationData.userId,
    request_by_type: notificationData.requestByType,
    request_by_id: notificationData.requestById,
    title: notificationMessage.title,
    description: notificationMessage.body,
    created: admin.firestore.FieldValue.serverTimestamp()
  };
  let message = {
    notification: {
      title: notificationMessage.title,
      body: notificationMessage.body
    },
    android: {
      notification: {
        click_action: notificationMessage.clickAction
      }
    },
    data: {
      data: JSON.stringify(notificationMessage.data)
    },
    token: notificationMessage.fcmToken
  };
  await notificationRef.set(data);
  try { 
    if (notificationMessage.fcmToken) 
      await admin.messaging().send(message);
  }
  catch (e) {}
}

module.exports = {
  notifyDriverAboutDriverConnectRequest,
  notifyDriverAboutDriverConnection,
  notifyDriverAboutPassengerConnectRequest,
  notifyPassengerAboutPassengerConnection,
  notifyDriverAboutEmployedDriverConnection,
  notifyDriverAboutEmployedDriverDisconnection
}