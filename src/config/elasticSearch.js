const { Client } = require('@elastic/elasticsearch');
const { ELASTIC_SEARCH_NODE_URL } = require('../constants/DefaultConstants');
const { elasticSearchUsername, elasticSearchPassword } = require('../config/credentials');

const esClient = new Client({ 
  node: ELASTIC_SEARCH_NODE_URL,
  auth: { username: elasticSearchUsername, password: elasticSearchPassword } 
});

module.exports = esClient;