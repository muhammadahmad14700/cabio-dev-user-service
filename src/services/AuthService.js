const { throwError } = require('../utils/Common');
const { encrypt, decrypt, generateJWT, generateRefreshJWT, verifyRefreshJWT } = require('../utils/AuthUtils');
const { admin } = require('../config/firebase-admin');
const AuthDAO = require('../dao/AuthDAO');
const authDAO = new AuthDAO();

class AuthService {

  async getTokens(payload) {
    let { email, password } = payload;
    let userType = payload.user_type;
    let collection = userType + 's';
    let user = await authDAO.findUserByEmail(collection, email);
    if (!user.get('password')) throwError(401, "Credentials Invalid");
    let decryptedPassword = decrypt(user.get('password'));
    if (password !== decryptedPassword) {
      throwError(401, "Credentials Invalid");
    }
    let data = {
      id: user.get('id'),
      email: user.get('email'),
      phoneNumber: user.get('number'),
      role: userType
    }
    let [token, refreshToken] = await Promise.all([
      generateJWT(data),
      generateRefreshJWT(data)
    ])
    return { token, refreshToken };
  }

  async refreshToken(payload) {
    let user = await verifyRefreshJWT(payload.refresh_token);
    let data = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role
    }
    return await generateJWT(data);
  }

  async registerUser(data) {
    let authResult = await this.createUser(data["email"], data["password"]);
    return {
      uid: authResult.uid,
      email: authResult.email,
      password: encrypt(data['password']),
    };
  }

  async updateUserEmail(data) {
    let { user, userType } = await authDAO.findUserAndTypeByEmail(data["user_email"]);
    let newData = { email: data["new_email"].toLowerCase() };
    await admin.auth().updateUser(user.id, newData);
    await authDAO.updateUserByUserType(user, userType, newData);
  }

  async updateUserPassword(data) {
    let { user, userType } = await authDAO.findUserAndTypeByEmail(data["user_email"]);
    let newData = { password: data["new_password"] };
    await admin.auth().updateUser(user.id, newData);
    newData.password = encrypt(data["new_password"]);
    await authDAO.updateUserByUserType(user, userType, newData);
  }

  async updateUserPasswordById(data) {
    let validationErrors = [];
    let { user, userType } = await authDAO.findUserAndTypeById(data["user_id"]);
    if (decrypt(user.get("password")) !== data["old_password"]) {
      throwError(409, "Old Password is incorrect");
    }
    this.checkPasswordMatch(data["new_password"], data["confirm_password"], validationErrors);
    if (validationErrors.length > 0) {
      throwError(400, "Validation Errors", validationErrors);
    }
    let newData = { password: data["new_password"] };
    await admin.auth().updateUser(user.id, newData);
    newData.password = encrypt(data["new_password"]);
    await authDAO.updateUserByUserType(user, userType, newData);
  }

  async createUser(email, password) {
    try {
      return await admin.auth().createUser({
        email: email.toLowerCase(),
        password: password
      });
    }
    catch (error) {
      let validationErrors = [];
      let errorCode = error.code;
      let errorMsg = error.message;
      if (errorCode == "auth/invalid-email") {
        validationErrors.push({
          key: "email",
          msg: "Email address is invalid"
        });
      }
      else if (errorCode == "auth/email-already-exists") {
        validationErrors.push({
          key: "email",
          msg: "Email is already in use"
        });
      }
      else if (errorCode == 'auth/invalid-password') {
        validationErrors.push({
          key: "password",
          msg: "Password is too weak"
        });
      }
      else {
        validationErrors.push({
          key: "other",
          msg: errorMsg
        });
      }
      throwError(400, "Validation Errors", validationErrors);
    }
  }

  async checkPasswordMatch(password, confirmPassword, validationErrors) {
    if (password !== confirmPassword) {
      validationErrors.push({
        key: "confirm_password",
        msg: "Password fields must match"
      });
    }
  }

}

module.exports = AuthService;
