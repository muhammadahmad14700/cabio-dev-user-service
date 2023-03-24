const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");
const { returnError, throwError } = require('./Common');
const cryptLib = require('@skavinvarnan/cryptlib');
const { masterKey, bearerToken } = require("../config/credentials");
const privateKey = fs.readFileSync(path.join(__dirname, '../private/private.key'), 'utf8');
const publicKey = fs.readFileSync(path.join(__dirname, '../private/public.key'), 'utf8');
const privateKey1 = fs.readFileSync(path.join(__dirname, '../private/private1.key'), 'utf8');
const publicKey1 = fs.readFileSync(path.join(__dirname, '../private/public1.key'), 'utf8');

module.exports = {

  encrypt: (str) => {
    const key = masterKey;
    const cipherText = cryptLib.encryptPlainTextWithRandomIV(str, key);
    return cipherText;
  },

  decrypt: (cipherText) => {
    const key = masterKey;
    const str = cryptLib.decryptCipherTextWithRandomIV(cipherText, key);
    return str;
  },

  generateJWT: (data) => {
    let options = { 
      expiresIn: '3h',
      issuer: "Cabio",
      audience: "www.cabio.pk",
      subject: data.id, 
      algorithm: "RS256" 
    };
    return new Promise((resolve, reject) => {
      jwt.sign(data, privateKey, options, function(err, token) {
        if (err) reject(new Error("Token Creation Failed"));
        resolve(token);
      });
    });
  },

  generateRefreshJWT: (data) => {
    let options = { 
      expiresIn: '180 days',
      issuer: "Cabio",
      audience: "www.cabio.pk",
      subject: data.id, 
      algorithm: "RS256" 
    };
    return new Promise((resolve, reject) => {
      jwt.sign(data, privateKey1, options, function(err, token) {
        if (err) reject(new Error("Token Creation Failed"));
        resolve(token);
      });
    });
  },

  verifyJWT: (token) => {
    return new Promise((resolve, reject) => {
      let options = { 
        issuer: "Cabio",
        audience: "www.cabio.pk",
        algorithm: ["RS256"] 
      };
      jwt.verify(token, publicKey, options, (err, decode) => {
        if (err) {
          if (err.name == 'TokenExpiredError') reject(returnError(406, "Token Expired"));
          if (err.name == 'JsonWebTokenError') reject(returnError(406, "Token Malformed"));
          if (err.name == 'NotBeforeError') reject(returnError(400, "Token Inactive"));
        }
        resolve(decode);
      });
    });
  },

  verifyRefreshJWT: (token) => {
    return new Promise((resolve, reject) => {
      let options = { 
        issuer: "Cabio",
        audience: "www.cabio.pk",
        algorithm: ["RS256"] 
      };
      jwt.verify(token, publicKey1, options, (err, decode) => {
        if (err) {
          if (err.name == 'TokenExpiredError') reject(returnError(406, "Token Expired"));
          if (err.name == 'JsonWebTokenError') reject(returnError(406, "Token Malformed"));
          if (err.name == 'NotBeforeError') reject(returnError(400, "Token Inactive"));
        }
        resolve(decode);
      });
    });
  },

  verifyBT: (token) => {
    if (token === bearerToken) {
      return { role: "tester" };
    }
    else throwError(406, "Token Malformed");
  },
}