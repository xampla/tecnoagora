// middleware.js
var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('../config');
var mongoose = require('mongoose');
var User  = mongoose.model('User');
var cookieParser = require('cookie-parser');
var service = require('../services');
var vPath = __dirname + '/../views/'
var fs = require('fs');
var strings = JSON.parse(fs.readFileSync(__dirname + '/../views/resources/lang/strings.json', 'utf8'));

exports.ensureAuthenticated = function(req, res, next) {
  if(!req.cookies.Token) {
    return res.status(403).render(vPath + "pages/error", {user: "Usuari", active: "",strings:strings,lang:req.lang});
  }
  var token = req.cookies.Token;
  var payload = jwt.decode(token, config.TOKEN_SECRET);
  var user = payload.sub;
  User.exists({username:user}, function(err_user, result) {
    if(err_user) return res.status(403).render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    if(result && payload.exp > moment().unix()) {
      req.user = payload.sub;
    }
    else {
      return res.cookie('Token', req.cookies.Token, { maxAge:0 }).render(vPath + "pages/login", {user: "Usuari", active: "",strings:strings,lang:req.lang});
    }
    next();
  });
}

exports.ensureNotAuthenticated = function(req, res, next) {
  if(req.cookies.Token) {
    var payload = jwt.decode(req.cookies.Token, config.TOKEN_SECRET);
    var user = payload.sub;
    User.exists({username:user}, function(err, result) {
      if(err) return res.status(403).render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
      if(result && payload.exp > moment().unix()) {
        return res.redirect('/');
      }
      else {
        res.cookie('Token', req.cookies.Token, { maxAge:0 });
        next();
      }
    });
  }
  else {
    next();
  }
}

exports.secCheck = function(req, res, next) {
  if(req.cookies.Token) {
    var payload = jwt.decode(req.cookies.Token, config.TOKEN_SECRET);
    var user = payload.sub;
    User.exists({username:user}, function(err, result) {
      if(result) {
        if(payload.exp <= moment().unix()) {
          return res.cookie('Token', req.cookies.Token, { maxAge:0 }).render(vPath + "pages/home", {user: "Usuari", active: "home",strings:strings,lang:req.lang});
        }
      }
      else {
        return res.cookie('Token', req.cookies.Token, { maxAge:0 }).render(vPath + "pages/home", {user: "Usuari", active: "home",strings:strings,lang:req.lang});
      }
      next();
    });
  }
}
