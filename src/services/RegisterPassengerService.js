const { capitalizeEachWord } = require("../utils/Common");
const { encrypt } = require("../utils/AuthUtils");
const sgMail = require("../config/sendGrid");
const AuthService = require('../services/AuthService');
const authService = new AuthService();
const RegisterPassengerDAO = require("../dao/RegisterPassengerDAO");
const registerPassengerDAO = new RegisterPassengerDAO();

class RegisterPassengerService {
  
  async registerPassenger(data) {
    let tmpPassengerId = await registerPassengerDAO.verifyPassenger(data);
    let authResult = await authService.createUser(data["email"], data["password"]);
    let payload = {
      id: authResult.uid,
      firstName: capitalizeEachWord(data["first_name"]),
      lastName: capitalizeEachWord(data["last_name"]),
      email: authResult.email,
      password: encrypt(data["password"]),
      phoneNumber: data["phone_number"],
      deviceId: data["device_id"],
      country: data["country"],
      referralCode: "",
    };
    await registerPassengerDAO.registerPassenger(payload);
    this.postRegistrationActions(payload, tmpPassengerId);
    return authResult.uid;
  }

  async postRegistrationActions(payload, tmpPassengerId) {
    await registerPassengerDAO.deleteTempPassenger(tmpPassengerId);
    await this.sendWelcomeEmail(payload);
  }

  async sendWelcomeEmail({ firstName, email }) {
    const msg = {
      from: {
        name: "Cabio Passenger",
        email: "no-reply@cabio.es",
      },
      personalizations: [
        {
          to: [
            {
              email
            },
          ],
          dynamic_template_data: {
            firstName,
            language: "en",
          },
        },
      ],
      subject: "Welcome to Cabio",
      template_id: "d-7cd1f967bd85471ba39abeab526634db",
    };
    await sgMail.send(msg);
  }
}

module.exports = RegisterPassengerService;
