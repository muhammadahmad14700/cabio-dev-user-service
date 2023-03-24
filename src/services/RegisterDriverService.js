const os = require('os');
const fs = require('fs');
const qrCode = require('qrcode');
const sgMail = require('../config/sendGrid');
const { admin } = require('../config/firebase-admin');
const { DEFAULT_BUCKET_NAME } = require('../constants/DefaultConstants');
const { decrypt } = require('../utils/AuthUtils');
const AuthService = require('../services/AuthService');
const authService = new AuthService();
const RegisterDriverDAO = require('../dao/RegisterDriverDAO');
const registerDriverDAO = new RegisterDriverDAO();

class RegisterDriverService {

  async registerDriver(data) {
    let tmpDriver = await registerDriverDAO.verifyDriver(data);
    let { email, password } = tmpDriver.get('registration').basic_details;
    let authResult = await authService.createUser(email, decrypt(password));
    let referralCode = await this.generateReferralCode();
    let payload = {
      id: authResult.uid,
      referralCode: referralCode,
      phoneNumber: tmpDriver.get('number'),
      registration: tmpDriver.get('registration'),
      postRegistration: tmpDriver.get('post_registration')
    };
    await registerDriverDAO.registerDriver(payload);
    this.postRegistrationActions(payload.id, tmpDriver.id);
  }

  randomString(length) {
    let result = "";
    let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = length; i > 0; --i)
      result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  }

  async generateReferralCode() {
    let refCode = this.randomString(6);
    let referralCodeExists = await registerDriverDAO.isAttributeValueAlreadyExists('referral_code', refCode);
    if (referralCodeExists) await this.generateReferralCode();
    return refCode;
  }

  async postRegistrationActions(driverId, tmpDriverId) {
    await registerDriverDAO.deleteTempDriver(tmpDriverId);
    let data = { "driver_id" : driverId }
    await this.sendQRCodeInEmail(data);
  }

  async sendQRCodeInEmail(data) {
    let driver = await registerDriverDAO.getDriver(data['driver_id']);
    let filenName = `${driver.get('id')}.png`;
    let filePath = `${os.tmpdir()}/${filenName}`;
    let destinationPath = `drivers/qrcodes/${filenName}`;
    await this.generateQRCode(data['driver_id'], filePath);
    await this.sendQRCodeEmail(driver, filePath);
    await this.uploadQRCodeToBucket(filePath, destinationPath);
  }

  generateQRCode(data, filePath) {
    return new Promise((resolve, reject) => {
      qrCode.toFile(filePath, data, {
        errorCorrectionLevel: 'H'
      }, err => {
        if (err) reject("Unable to generate QRCode");
        else resolve("QRCode generated");
      });
    });
  }

  async sendQRCodeEmail(driver, filePath) {
    let attachment = fs.readFileSync(filePath).toString("base64");
    const msg = {
      to: driver.get('email'),
      from: 'no-reply@cabio.es',
      subject: 'Cabio QRCode',
      text: 'Connect your passengers with yourself',
      html: `Hi ${driver.get('first_name')}, 
        <p>You can use the QRCode attached below to connect 
        your passengers with yourself on Qairos.</p>`,
      attachments: [
        {
          content: attachment,
          filename: "qrcode.png",
          type: "image/png",
          disposition: "attachment"
        }
      ]
    };
    await sgMail.send(msg);
  }

  async uploadQRCodeToBucket(filePath, destinationPath) {
    let bucketName = DEFAULT_BUCKET_NAME;
    let options = {
      destination: destinationPath,
      gzip: true,
      metadata: {
        cacheControl: 'public, max-age=31536000'
      }
    };
    let bucket = admin.storage().bucket(bucketName);
    await bucket.upload(filePath, options);
    await bucket.file(destinationPath).makePublic();
    fs.unlinkSync(filePath);
  }

}

module.exports = RegisterDriverService;
