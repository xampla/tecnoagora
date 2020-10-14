var mongoose = require('mongoose');
var User  = mongoose.model('User');
var RecoverPass  = mongoose.model('Recover');
var VerifyEmail  = mongoose.model('Verify');
var service = require('../services');
var Profile = require('./profile');
var nodemailer = require('nodemailer');
const { google } = require("googleapis");
var config = require('../config');
const OAuth2 = google.auth.OAuth2;
const bcrypt = require('bcrypt');
const https = require('https');
var crypto = require('crypto');
var vPath = __dirname + '/../views/';
var fs = require('fs');
var strings = JSON.parse(fs.readFileSync(__dirname + '/../views/resources/lang/strings.json', 'utf8'));

const { validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');

exports.login = function(req, res) {
  res.render(vPath + "pages/login", {user: "Usuari", active: "",strings:strings,lang:req.lang});
};

exports.emailSignup = function(req, res) {
  var name = req.body.name;
  var surname = req.body.surname;
  var username = req.body.username;
  var email = req.body.email;
  var socialLink = req.body.socialLink;
  var description = req.body.description;
  var pass = req.body.pass;


  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.status(200).json({ok: false, msg:strings["errors"]["error_dades"][req.lang]});
  }

  User.findOne({username:username}, function(err_find_username,user_username) {
    if(err_find_username) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
    if(user_username) return res.status(200).json({ok: false, msg:strings["errors"]["error_username_registrat"][req.lang]});

    User.findOne({email:email}, function(error_find_user, user_email) {
      if(error_find_user) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
      console.log(!user_email);

      if(!user_email) {
        bcrypt.hash(pass, 10, function(err_hash, hash) {
          if(err_hash) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
          Profile.getRandomProfilePic(function(svgImage){
            var svgImage_b = new Buffer.from(svgImage).toString('base64');
            console.log(svgImage_b);

            // Store hash in database
            var user = new User({
              name:      name,
              surname:   surname,
              username:  username,
              email:     email,
              emailVerified: false,
              pass:      hash,
              extLink:   socialLink,
              desc:      description,
              profile_pic: svgImage_b,
              date:      new Date(),
              spentPoints: 0
            });

            user.save(function(err){
              crypto.randomBytes(20, function(err_token, buf) {
                if(err_token) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
                var token = buf.toString('hex');

                var verifyEmail = new VerifyEmail({
                 token:      token,
                 email:      email,
                 expire:     Date.now()+3600000 //1 hour
                });

                verifyEmail.save(function(err_save_ver, verEmail) {
                  if(err_save_ver) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
                  if(verEmail) {
                    service.sendMail(email,"welcomeVerifyEmail",token, function(result) {
                      if(result) return res.status(200).json({ok: true, msg:strings["general"]["join_correcte"][req.lang]});
                      return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
                    });
                  }
                });
              });
            });
          });
        });
      }
      else {
        service.sendMail(email,"welcomeAlreadyRegistered","", function(result) {
          if(result) return res.status(200).json({ok: true, msg:strings["general"]["join_correcte"][req.lang]});
          return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
        });
      }
    });
  });
};

exports.emailLogin = function(req, res) {
  var email = req.body.email;
  var pass = req.body.pass;
  var rem = req.body.remember;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
  }

  User.findOne({email: email}, function(err_find_user, user) {
    if(!user) return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
    if(err_find_user) return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
    hash = user.pass;
    bcrypt.compare(pass, hash, function(err_comp_hash, result) {
      if(err_comp_hash) return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
      if(result) {
        if(rem) res.cookie('Token', service.createToken(user), { maxAge:999999999, secure:true, httpOnly:true, domain:'127.0.0.1', path:'/', sameSite: 'lax'});
        else res.cookie('Token', service.createToken(user), { secure:true, httpOnly:true, domain:'127.0.0.1', path:'/', sameSite: 'lax'});
        return res.status(200).json({ok: true, msg:strings["general"]["login_correcte"][req.lang]});
      }
      else {
        return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
      }
    });
  });
};

exports.forgotPasswordPost = function(req, res) {
  var email = req.body.email;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.status(200).json({ok: false, msg:strings["errors"]["error_mail"][req.lang]});
  }

  User.findOne({email: email}, function(err_find_user, user) {
    if(err_find_user) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});

    if(user != null) {
      crypto.randomBytes(20, function(err_token, buf) {
        if(err_token) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
        var token = buf.toString('hex');

          var recover = new RecoverPass({
            token:      token,
            email:      email,
            expire:     Date.now()+3600000 //1 hour
          });

          recover.save(function(err_save_rec,recPass) {
            if(err_save_rec) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
            if(recPass) {
              service.sendMail(email,"recoverPassword",token, function(result) {
                if(result) res.status(200).json({ok: true, msg:strings["reset_pass"]["reset_pass_msg"][req.lang]});
                return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
              });
            }
          });
      });
    }
    else {
      res.status(200).json({ok: true, msg:strings["reset_pass"]["reset_pass_msg"][req.lang]});
    }
  });
};

exports.forgotPasswordGet = function(req, res) {
  res.render(vPath + "pages/forgotPassword", {user: "Usuari", active: "",strings:strings,lang:req.lang});
};


exports.recoverPasswordGet = function(req, res) {
  var token = req.params.token;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.render(vPath + "pages/error", {user: "Usuari", active: "",strings:strings,lang:req.lang});
  }

  RecoverPass.findOne({ token: token, expire: { $gt: Date.now() } }, function(err_find_rec, rec) {
    if(err_find_rec) return res.render(vPath + "pages/error", {user: "Usuari", active: "",strings:strings,lang:req.lang});
    if(!rec) {
      res.render(vPath + "pages/error", {user: "Usuari", active: "",strings:strings,lang:req.lang});
    }
    else {
      res.render(vPath + "pages/recoverPassword", {user: "Usuari", active: "",strings:strings,lang:req.lang});
    }
  });
};

exports.recoverPasswordPost = function(req, res) {
  var token = req.params.token;
  var pass1 = req.body.pass1;
  var pass2 = req.body.pass2;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.status(200).json({ok: false, msg:strings['errors']['error_pass'][req.lang]});
  }

  if(pass1 != pass2) return res.status(200).json({ok: false, msg:strings['errors']['error_same_pass'][req.lang]});

  RecoverPass.findOne({ token: token, expire: { $gt: Date.now() } }, function(err_find_rec, rec) {
    if(err_find_rec) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
    if(!rec) {
      res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
    }
    else {
      bcrypt.hash(pass1, 10, function(err_hash, hash) {
        if(err_hash) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
        User.updateOne({email: rec.email}, {pass:hash}, function(error_update_user, usr) {
          if(error_update_user) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
          RecoverPass.updateOne({token: token}, {expire: Date.now()-3600000}, function(err_update_rec, rec) {
            if(err_update_rec) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
            res.status(200).json({ok: true, msg:strings["reset_pass"]["reset_correct"][req.lang]});
          });
        });
      });
    }
  });
};