var mongoose = require('mongoose');
var User  = mongoose.model('User');
var Contact  = mongoose.model('Contact');
var service = require('../services');
const bcrypt = require('bcrypt');
var config = require('../config');
var nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
var jwt = require('jwt-simple');
var service = require('../services');
var vPath = __dirname + '/../views/';
var fs = require('fs');
var strings = JSON.parse(fs.readFileSync(__dirname + '/../views/resources/lang/strings.json', 'utf8'));

const { validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');

exports.home = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/home", {user: user, active: "home",strings:strings,lang:req.lang});
};

exports.addEntry = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/afegir", {user: user, active: "afegirProj",strings:strings,lang:req.lang});
};

exports.join = function(req, res) {
  res.render(vPath + "pages/unirse", {user: "Usuari", active: "unirse",strings:strings,lang:req.lang});
};

exports.logout = function(req, res) {
  res.cookie('Token', req.cookies.Token, { maxAge:0,path:'/', });
  res.redirect('/');
};

exports.faqs = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/faqs", {user: user, active: "",strings:strings,lang:req.lang});
};

exports.contact = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/contact", {user: user, active: "",strings:strings,lang:req.lang});
};

exports.sendContact = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var name = req.body.name;
  var surname = req.body.surname;
  var desc = req.body.desc;
  var email = req.body.email;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.status(200).json({ok: false, msg:strings["errors"]["error_dades"][req.lang]});
  }

  var contact = new Contact({
    name:      name,
    surname:   surname,
    email:     email,
    desc:      desc,
    date:      new Date()
  });

  contact.save(function(err,ctc){
    if(err) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
    if(ctc){
      var d = {name:name,surname:surname,desc:desc,email:email}
      service.sendMail(email,"contactForm",d, function(result) {
        if(result) res.status(200).json({ok: true, msg:strings["contacte"]["breus_resposta"][req.lang]});
        return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
      });
    }
  });
};

exports.changeLang = function(req, res) {
  var lang = req.query.lang;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.status('200').redirect(req.get('referer'));
  }

  if(lang == 'cat') res.cookie('lang', 'cat', { maxAge:999999999, secure:true, httpOnly:true, Domain:'tecnoagora.com', Path:'/', SameSite:'Lax' });
  else if(lang == 'es') res.cookie('lang', 'es', { maxAge:999999999, secure:true, httpOnly:true, Domain:'tecnoagora.com', Path:'/', SameSite:'Lax' });
  else if(lang == 'en') res.cookie('lang', 'en', { maxAge:999999999, secure:true, httpOnly:true, Domain:'tecnoagora.com', Path:'/', SameSite:'Lax' });
  res.status('200').redirect(req.get('referer'));
}

exports.cookiePolicy = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/cookiePolicy", {user: user, active: "home",strings:strings,lang:req.lang});
}

exports.privacyPolicy = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/privacyPolicy", {user: user, active: "home",strings:strings,lang:req.lang});
}

exports.termsAndConditions = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/termsAndConditions", {user: user, active: "home",strings:strings,lang:req.lang});
}

exports.error = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
};

exports.notFound = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
};
