// middleware.js
var mongoose = require('mongoose');
const { RateLimiterMongo } = require('rate-limiter-flexible');
const mongooseClient = mongoose.connection;

const rateLimiterContact = new RateLimiterMongo({
  storeClient: mongooseClient,
  keyPrefix: 'middleware',
  points: 5, // 10 requests
  duration: 60*60*24, // per 1 day by IP
  blockDuration: 60 * 60 * 3, // Block for 3 hour
});

exports.rateLimiterContact = function(req, res, next) {
  //rateLimiterContact.delete(req.ip);
  rateLimiterContact.consume(req.ip)
    .then(function(){
      req.bruteForce = false;
      next();
    })
    .catch(function(){
      req.bruteForce = true;
      next();
      //res.status(429).send('Too Many Requests');
    });
};
