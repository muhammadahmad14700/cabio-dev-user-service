const esClient = require("../config/elasticSearch");
const { ELASTIC_SEARCH_PASSENGER_INDEX, ELASTIC_SEARCH_DRIVER_INDEX } = require("../constants/DefaultConstants");

const getAllSearchedDriverIds = async (textSearch, country) => {
  let searchQuery = {
    index: ELASTIC_SEARCH_DRIVER_INDEX,
    size: 50,
    _source: false,
    body: {
      query: {
        bool: { 
          must: {
            query_string: {
              query: `*${textSearch}*`,
              default_field: "company",
              fuzziness: "AUTO"
            }
          },
          filter: [
            { term: { "country.raw": country }},
          ]
        }
      }
    }
  };
  const { body } = await esClient.search(searchQuery);
  return body.hits.hits.map(doc => doc._id);
}

const updatePassengerInES = async (passengerId, updatedData)=>{
  try {
    await esClient.update({
      index: ELASTIC_SEARCH_PASSENGER_INDEX,
      _source: false,
      id: passengerId,
      body: {
        doc: updatedData
      }
    });
  }
  catch(e) { console.error(e) }
}


module.exports = {
  getAllSearchedDriverIds,
  updatePassengerInES
}