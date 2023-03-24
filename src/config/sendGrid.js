const sgMail = require('@sendgrid/mail');
const credentials = require('./credentials');

// initialize sendgrid
sgMail.setApiKey(credentials.sendGridApiKey);

module.exports = sgMail;