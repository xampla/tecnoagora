var mongoose = require('mongoose');
var User  = mongoose.model('User');
var RecoverPass  = mongoose.model('Recover');
var VerifyEmail  = mongoose.model('Verify');
var service = require('../services');
var Profile = require('./profile');
var nodemailer = require('nodemailer');
const { google } = require("googleapis");
const { RateLimiterMongo } = require('rate-limiter-flexible');
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

const mongooseClient = mongoose.connection;
const maxConsecutiveFailsByUsernameAndIP = 5;
const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterMongo({
  storeClient: mongooseClient,
  keyPrefix: 'login_fail_consecutive_username_and_ip',
  points: maxConsecutiveFailsByUsernameAndIP,
  duration: 60 * 60 * 24, // Store per 1 day
  blockDuration: 60 * 60, // Block for 1 hour
});
const getUsernameIPkey = function(username, ip) { `${username}_${ip}`};

exports.login = function(req, res) {
  res.render(vPath + "pages/login", {user: "Usuari", active: "",strings:strings,lang:req.lang});
};

exports.emailSignup = function(req, res) {
  var name = req.body.name;
  var surname = req.body.surname;
  var username = req.body.username;
  var email = req.body.email;
  //var socialLink = req.body.socialLink;
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

            // Store hash in database
            var user = new User({
              name:      name,
              surname:   surname,
              username:  username,
              email:     email,
              emailVerified: false,
              pass:      hash,
              //extLink:   socialLink,
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
                 expire:     Date.now()+86400000 //24 hour
                });

                verifyEmail.save(function(err_save_ver, verEmail) {
                  if(err_save_ver) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
                  if(verEmail) {
                    var d = {token:token, user:username, lang:req.lang};
                    service.sendMail(email,"welcomeVerifyEmail",d, function(result) {
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
        var d = {user:username, lang:req.lang};
        service.sendMail(email,"welcomeAlreadyRegistered",d, function(result) {
          if(result) return res.status(200).json({ok: true, msg:strings["general"]["join_correcte"][req.lang]});
          return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
        });
      }
    });
  });
};

/*
User.findOne({email: email}, function(err_find_user, user) {
  if(!user) return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
  if(err_find_user) return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
  hash = user.pass;
  bcrypt.compare(pass, hash, function(err_comp_hash, result) {
    if(err_comp_hash) return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
    if(result) {
      if(rem) res.cookie('Token', service.createToken(user), { maxAge:999999999, secure:true, httpOnly:true, domain:'tecnoagora.com', path:'/', sameSite: 'lax'});
      else res.cookie('Token', service.createToken(user), { secure:true, httpOnly:true, domain:'tecnoagora.com', path:'/', sameSite: 'lax'});
      return res.status(200).json({ok: true, msg:strings["general"]["login_correcte"][req.lang]});
    }
    else {
      return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
    }
  });
});
*/

function loginUser(email,pass,next) {
  User.findOne({email: email}, function(err_find_user, user) {
    if(!user) next(null);
    if(err_find_user) next(null);
    hash = user.pass;
    bcrypt.compare(pass, hash, function(err_comp_hash, result) {
      if(err_comp_hash) next(null);
      if(result) next(user);
      else next(null);
    });
  });
}

exports.emailLogin = async function(req, res) {
  var email = req.body.email;
  var pass = req.body.pass;
  var rem = req.body.remember;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});
  }

  //const getUsernameIPkey = function(username, ip) { `${username}_${ip}`};
  const ipAddr = req.ip;
  const usernameIPkey = getUsernameIPkey(email, ipAddr);

  const resUsernameAndIP=await Promise.all([limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey)]);

  let retrySecs = 0;


  if (resUsernameAndIP[0] !== null && resUsernameAndIP[0].consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
    retrySecs = Math.round(resUsernameAndIP[0].msBeforeNext / 1000) || 1;
  }

  if (retrySecs > 0) {
    res.status(200).json({ok: false, msg:strings["errors"]["error_too_much_login"][req.lang]});
  } else {
    // should be implemented in your project
    loginUser(email,pass, async function(user) {
      if (!user) {
        // Consume 1 point from limiters on wrong attempt and block if limits reached
        try {
          // Count failed attempts by Username + IP only for registered users
          const promises = limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey);
          await Promise.all([promises]);
          res.status(200).json({ok: false, msg:strings["errors"]["error_credencials_incorrectes"][req.lang]});

        } catch (rlRejected) {
          if (rlRejected instanceof Error) {
            throw rlRejected;
          } else {
            res.status(200).json({ok: false, msg:strings["errors"]["error_too_much_login"][req.lang]});
          }
        }
      }

      if (user) {

        if (resUsernameAndIP[0] !== null && resUsernameAndIP[0].consumedPoints > 0) {
          // Reset on successful authorisation
          await limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
        }

        if(rem) res.cookie('Token', service.createToken(user), { maxAge:999999999, secure:true, httpOnly:true, domain:'tecnoagora.com', path:'/', sameSite: 'lax'});
        else res.cookie('Token', service.createToken(user), { secure:true, httpOnly:true, domain:'tecnoagora.com', path:'/', sameSite: 'lax'});
        return res.status(200).json({ok: true, msg:strings["general"]["login_correcte"][req.lang]});
      }
    });
  }
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
              var d = {token:token, user:user.username, lang:req.lang};
              service.sendMail(email,"recoverPassword",d, function(result) {
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
            const usernameIPkey = getUsernameIPkey(rec.email, req.ip);
            limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
            res.status(200).json({ok: true, msg:strings["reset_pass"]["reset_correct"][req.lang]});
          });
        });
      });
    }
  });
};
