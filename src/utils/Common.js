const { DEFAULT_COUNTRY, DEFAULT_LANGUAGE, COUNTRIES, LANGUAGES } = require('../constants/DefaultConstants');

// common functions
module.exports = {
  capitalize: (str) => {
    str = str.trim();
    return str[0].toUpperCase() + str.slice(1);
  },

  lowercase: (str) => {
    return str.trim().toLowerCase();
  },

  capitalizeEachWord: (str) => {
    let words = str.trim().split(" ");
    words.forEach((word, index)=> {
      words[index] = word[0].toUpperCase() + word.slice(1);
    });
    return words.join(' ');
  },

  equalsIgnoringCase: function (a, b) {
    return a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;
  },

  setCountry: (data) => {
    let country = COUNTRIES.find(country => {
      return country.iso2.localeCompare(data._country, undefined, { sensitivity: 'base' }) === 0 
    });
    if (!country) data._country = DEFAULT_COUNTRY;
    else data._country = country;
  },

  getCountry: (countryName) => {
    let country = COUNTRIES.find(country => {
      return country.name.localeCompare(countryName, undefined, { sensitivity: 'base' }) === 0 
    });
    if (!country) return DEFAULT_COUNTRY;
    return country;
  },

  getLanguage: (lang) => {
    if (LANGUAGES.includes(lang)) return lang;
    return DEFAULT_LANGUAGE;
  },

  toFloat: (num, key = "amount") => {
    let number = parseFloat(num);
    if (isNaN(number)) throw new Error(`${key} is not a number`);
    return number;
  },

  validateRequiredFields: (data, requiredFields) => {
    let requiredData = [];
    for (let [key, value] of Object.entries(requiredFields)) {
      if (!data[key]) {
        requiredData.push({
          key: key,
          msg: `${value} is required`
        });
      }
    }
    return requiredData;
  },
  
  returnError: (statusCode, errorMessage) => {
    let error = new Error(errorMessage);
    error.statusCode = statusCode ? statusCode : 400;
    return error;
  },
  
  throwError: (statusCode, errorMessage, data = null) => {
    let error = new Error(errorMessage);
    error.statusCode = statusCode ? statusCode : 400;
    if (data) error.data = data;
    throw error;
  },
}
