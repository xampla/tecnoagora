// services.js
var mongoose = require('mongoose');
var User  = mongoose.model('User');
var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./config');
const { google } = require("googleapis");
var nodemailer = require('nodemailer');
const OAuth2 = google.auth.OAuth2;

exports.createToken = function(user) {
  var payload = {
    sub: user.username,
    iat: moment().unix(),
    exp: moment().add(14, "days").unix(),
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
};

exports.getUserFromToken = function(token) {
  var user = "Usuari"
  if(token!=null) {
    user = jwt.decode(token, config.TOKEN_SECRET).sub;
  }
  return user;
};

exports.sendMail = function(email, type, data, callback) {

  console.log("Preparing an email....");

  var subject;
  var emailBody;

  if(type=="welcomeVerifyEmail") {
    subject = "[TECNOAGORA] Email address verification";
    emailBody = "<p> Hi,</p> <p> Last step to fully register to TecnoAgora: </p> <p>http://tecnoagora.com/verifyEmail/" + data + "</p>";
  } else if(type=="welcomeAlreadyRegistered") {
    subject = "[TECNOAGORA] Account already created";
    emailBody = "<p> Hi,</p> <p> Someone has tried to sign up with you email. If it was you, we wanted to let you know you already have an account and you can reset your password in case you forgot it. If it wasn't you, you do not have to do anything.</p>";
  } else if(type=="changeEmail") {
    subject = "[TECNOAGORA] Email address verification";
    emailBody = "<p> Hi,</p> <p> Last step to fully register to TecnoAgora: </p> <p>http://tecnoagora.com/verifyUpdateEmail/" + data;
  } else if(type=="recoverPassword") {
    subject = "[TECNOAGORA] Password reset";
    emailBody = "<p> Hi,</p> <p> Here you have the link to reset your password:</p> <p>http://tecnoagora.com/recoverPassword/" + data + "</p>";
  } else if(type=="contactForm") {
    subject = "[CONSULTA] Nova Consulta Web";
    emailBody = "<p> Name:"+data['name']+" "+data['surname']+"</p> <p> Email: " +data['email']+" </p> <p> Consult:" +data['desc']+ "</p>";
  }
  else {
    callback(false);
  }

  const oauth2Client = new OAuth2(
       config.mail.clientId, // ClientID
       config.mail.clientSecret, // Client Secret
       config.mail.redirectURL // Redirect URL
  );
  oauth2Client.setCredentials({
       refresh_token: config.mail.refreshToken
  });
  const accessToken = oauth2Client.getAccessToken();

  const smtpTransport = nodemailer.createTransport({
     service: "Gmail",
     auth: {
          type: "OAuth2",
          user: config.mail.user,
          clientId: config.mail.clientId,
          clientSecret: config.mail.clientSecret,
          refreshToken: config.mail.refreshToken,
          accessToken: accessToken
     }
   });

   const mailOptions = {
      from: config.mail.user,
      to: email,
      subject: subject,
      generateTextFromHTML: true,
      html: emailBody
     };

     smtpTransport.sendMail(mailOptions, function (err_send_email, info) {
       console.log(info);
       callback(true);
     });
};
