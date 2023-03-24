const requestIp = require('request-ip');
const ioRedis = require("ioredis");
const { RateLimiterRedis, RateLimiterUnion } = require('rate-limiter-flexible');
const { REDIS_HOST, RATE_LIMITER_STATUS } = require('../constants/DefaultConstants');
const { throwError } = require('../utils/Common');

// redis
let anonymousRateLimiterConfig, shortRateLimiterConfig, longRateLimiterConfig;
let isRateLimiterEnabled = process.env.NODE_ENV == "production" && RATE_LIMITER_STATUS == "on";

if (isRateLimiterEnabled) {
  const redis = new ioRedis({
    host: REDIS_HOST,
    enableOfflineQueue: false,
    showFriendlyErrorStack: true
  });

  redis.on('error', (err) => {
    console.error("Redis Error: ", err);
  });

  anonymousRateLimiterConfig = new RateLimiterUnion(
    new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rlflx1',
      points: 2,
      duration: 1,
      blockDuration: 60
    }),
    new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rlflx2',
      points: 10,
      duration: 60,
      blockDuration: 600
    })
  );
  
  shortRateLimiterConfig = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rlflx3',
    points: 10,
    duration: 60,
    blockDuration: 60
  });
  
  longRateLimiterConfig = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rlflx4',
    points: 150,
    duration: 60,
    blockDuration: 60
  });  
}

const anonymousRateLimiter = async (req, res) => {
  try {
    if (isRateLimiterEnabled) {
      let userIp = req.headers["x-appengine-user-ip"] || requestIp.getClientIp(req);
      if (userIp) await anonymousRateLimiterConfig.consume(userIp);
    }
  }
  catch(rejRes) {
    if (rejRes instanceof Error) {
      console.error("Redis Error: ", rejRes);
    }
    else {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      throwError(429, "Too many requests");
    }
  }
};

const generalRateLimiter = async (limiterType, req, res) => {
  try {
    if (isRateLimiterEnabled) {
      if (limiterType == "short") {
        if (req.body._user) await shortRateLimiterConfig.consume(req.body._user.id);
      }
      else if (limiterType == "long") {
        if (req.body._user) await longRateLimiterConfig.consume(req.body._user.id);
      }
    }
  }
  catch(rejRes) {
    if (rejRes instanceof Error) {
      console.error("Redis Error: ", rejRes);
    }
    else {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      throwError(429, "Too many requests");
    }
  }
};

module.exports = {
  anonymousRateLimiter,
  generalRateLimiter
};