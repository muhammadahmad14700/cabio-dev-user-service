const esClient = require("../config/elasticSearch");
const { ELASTIC_SEARCH_DRIVER_INDEX } = require("../constants/DefaultConstants");

const updateDriverInES = async (driverId, updatedData) => {
  try {
    await esClient.update({
      index: ELASTIC_SEARCH_DRIVER_INDEX,
      id: driverId,
      body: {
        doc: updatedData
      }
    });
  }
  catch(e) { console.error(e) }
}

const getDailyStatsId = () => {
  let pakDate = new Date().toLocaleString('en-US', { timeZone: "Asia/Karachi", hour12: false });
  let d = new Date(pakDate),
    month = String(d.getMonth() + 1).padStart(2, '0'),
    day = String(d.getDate()).padStart(2, '0'),
    year = String(d.getFullYear());
  return [year, month, day].join('-');
}

module.exports = {
  updateDriverInES,
  getDailyStatsId
}