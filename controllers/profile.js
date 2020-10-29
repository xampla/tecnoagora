var mongoose = require('mongoose');
var User  = mongoose.model('User');
var Projectes  = mongoose.model('Project');
var Activity  = mongoose.model('Activity');
var VerifyEmail  = mongoose.model('Verify');
var ChangeEmail  = mongoose.model('ChangeEmail');
var Award = mongoose.model('Award');
var service = require('../services');
const bcrypt = require('bcrypt');
var crypto = require('crypto');
var jwt = require('jwt-simple');
var service = require('../services');
var vPath = __dirname + '/../views/'
var fs = require('fs');
const https = require('https');
var strings = JSON.parse(fs.readFileSync(__dirname + '/../views/resources/lang/strings.json', 'utf8'));

const { validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');

exports.profile = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  User.findOne({username:user}, function(err_user, profile) {
    if(profile==null) {
      return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    }
    else {
      Projectes.find({_id: {$in: profile.savedProj}}, function(err_proj_saved, saved) {
        if(err_proj_saved) return res.render(vPath + "pages/error", {user: "Usuari", active: "",strings:strings,lang:req.lang});
        Projectes.find({_id: {$in: profile.addedProj}}, function(err_proj_added, added) {
          if(err_proj_added) return res.render(vPath + "pages/error", {user: "Usuari", active: "",strings:strings,lang:req.lang});
          else {
            profile.pass = "";
            res.render(vPath + "pages/profile", {user: user, active: "perfil", profile:profile, savedProj: saved, addedProj: added,strings:strings,lang:req.lang});
          }
        });
      });
    }
  });
};

/*
exports.editProfile = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  User.findOne({username:user},function(err, profile) {
    res.render(vPath + "pages/editProfile", {user: user, active: "perfil", profile:profile});
  });
};


exports.savedProjects = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  res.render(vPath + "pages/savedProjects", {user: user, active: "perfil"});
};
*/

exports.saveProject = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);

  var id = mongoSanitize.sanitize(req.params.id);
  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false});
  }

  Projectes.findOneAndUpdate({_id: id},{$inc:{numSaves:1}},{new: true}, function(err_proj, proj) {
    if(err_proj) return res.status(200).json({ok: false});
    User.updateOne({username: user, savedProj:{$nin: id}},{$push:{savedProj:id}}, function(err_update_usr, usr) {
      if(err_update_usr) return res.status(200).json({ok: false});
      if(usr['nModified']!=0) {
        Activity.findOne({creator:user,actType:"projectSaved",referenceId:id,body: proj.title}, function(err_act_find, act){
          if(err_act_find) return res.status(200).json({ok: false});
          if(!act){
            var activity = new Activity({
              creator:      user,
              actType:      "projectSaved",
              referenceId:  id,
              body:         proj.title,
              date:         new Date()
            });
            activity.save(function(err, act) {
              console.log(act);
              res.status(200).json({ok: true, numSaves:proj.numSaves});
            });
          }
          else {
            res.status(200).json({ok: true, numSaves:proj.numSaves});
          }
        });
      }
      else {
        return res.status(200).json({ok: false});
      }
    });
  });
};

exports.unsaveProject = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);

  var id = mongoSanitize.sanitize(req.params.id);
  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false});
  }

  Projectes.findOneAndUpdate({_id: id},{$inc:{numSaves:-1}},{new: true}, function(err_proj, proj) {
    if(err_proj) return res.status(200).json({ok: false});
    User.updateOne({username: user, savedProj:{$in: id}},{$pull:{savedProj:id}}, function(err, usr) {
      if(usr['nModified']!=0){
        res.status(200).json({ok: true, numSaves:proj.numSaves});
      }
      else {
        res.status(200).json({ok: false});
      }
    });
  });
};

exports.getActivity = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  User.findOne({username: user}, function(err_user, u){
    if(err_user) return res.status(200).json({ok: false, msg:strings['activitat'], lang:req.lang});
    Activity.aggregate([
      {$match:
        {$or:[
          {referenceId:{$in:u.addedProj}},
          {referenceId:{$in:u.savedProj}},
          {referenceId:{$in:u.comments}}
        ]}},
      {$sort:{data:1}}
    ]).exec(function(err_act, act) {
      if(err_act) return res.status(200).json({ok: false});
      res.status(200).json({ok: true, activity:act, msg:strings['activitat'], lang:req.lang});
    });
  });
};

exports.getUserPoints = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  User.findOne({username: user}, function(err_user, u) {
    if(err_user) return res.status(200).json({ok: false});
    Projectes.aggregate([
      {$match: {_id:{$in: u.addedProj}}},
      {$group: {_id: null, sumProjAdded: {$sum: "$numRates"},sumProjSaved: {$sum: "$numSaves"}}}
    ]).exec(function(err_proj, proj) {
      if(err_proj) return res.status(200).json({ok: false});
      console.log(proj);
      if(Object.keys(proj).length!==0) {
        var total = proj[0]['sumProjAdded']+proj[0]['sumProjSaved'];
        res.status(200).json({ok: true, points:total, msg:strings['general']['punts'][req.lang]});
      } else {
        res.status(200).json({ok: true, points:0});
      }
    });
  });
};

exports.getOtherUserPoints = function(req, res) {
  var user = mongoSanitize.sanitize(req.params.username);
  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false});
  }

  module.exports.getUserPointsExt(user, function(points){
    if(points<0) return res.status(200).json({ok: false});
    res.status(200).json({ok: true, points:points});
  });
};

exports.getUserPointsExt = function(user,callback) {
  var points = -1;
  User.findOne({username: user}, function(err_user, u) {
    if(!err_user) {
      Projectes.aggregate([
        {$match: {_id:{$in: u.addedProj}}},
        {$group: {_id: null, sumProjAdded: {$sum: "$numRates"},sumProjSaved: {$sum: "$numSaves"}}}
      ]).exec(function(err_proj, proj) {
        if(!err_proj) {
          if(Object.keys(proj).length!==0) {
            points = proj[0]['sumProjAdded']+proj[0]['sumProjSaved'];
            callback(points);
          }
          else callback(points);
        }
        else callback(points);
      });
    }
    else callback(points);
  });
};

exports.getUserMemberDate = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  User.findOne({username: user}, function(err_user, u) {
    if(err_user) return res.status(200).json({ok: false});
    var d = new Date(u.date);
    var day = d.getDate();
    var month = d.getMonth()+1;
    var year = d.getFullYear();
    res.status(200).json({ok: true, date:day+"/"+month+"/"+year});
  });
};

exports.updateProfile = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var name = req.body.name;
  var surname = req.body.surname;
  var desc = req.body.desc;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false, msg:strings["errors"]["error_dades"][req.lang]});
  }

  User.updateOne({username: user}, {$set:{$name:name, $surname:surname, $desc:desc}}, function(err, usr) {
    if(err) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
    res.status(200).json({ok: true, msg:strings["general"]["dades_actualitzades"][req.lang]});
  });
};

exports.updatePassword = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var password = req.body.actualPass;
  var password_new = req.body.newPass;
  var password_new_check = req.body.newPassCheck;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false});
  }

  if(password_new != password_new_check) return res.status(200).json({ok: false, msg:strings["errors"]["error_same_pass"][req.lang]});

  User.findOne({username: user}, function(err_find, usr) {
    if(err_find) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
    var hash = usr.pass;
    bcrypt.compare(password, hash, function(err_hash, result) {
      if(err_hash) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
      if(result) {
        bcrypt.hash(password_new, 10, function(err_new_hash, new_hash) {
          if(err_new_hash) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
          User.updateOne({username: user}, {pass:new_hash}, function(err_update, usr) {
            if(err_update) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
            res.status(200).json({ok: true, msg:strings["reset_pass"]["modifica_correct"][req.lang]});
          });
        });
      } else {
       res.status(200).json({ok: false, msg:strings["errors"]["error_correct_pass"][req.lang]});
      }
    });
  });
};

exports.verifyEmail = function(req,res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var token = req.params.token;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/verifyEmail", {user: user, active: "", ok:false,strings:strings,lang:req.lang});
  }

  VerifyEmail.findOne({ token: token, expire: { $gt: Date.now() } }, function(err_find, ver) {
    if(err_find) return res.render(vPath + "pages/verifyEmail", {user: user, active: "", ok:false,strings:strings,lang:req.lang});
    if(!ver) res.render(vPath + "pages/verifyEmail", {user: user, active: "", ok:false,strings:strings,lang:req.lang});
    else {
      User.updateOne({email: ver.email}, {$set:{emailVerified:true}}, function(err_update_usr, usr) {
        if(err_update_usr) {
          res.render(vPath + "pages/verifyEmail", {user: user, active: "", ok:false,strings:strings,lang:req.lang});
        } else {
          VerifyEmail.updateOne({token: token}, {expire: Date.now()-3600000}, function(err_update_ver, rec) {
            if(err_update_ver) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
            res.render(vPath + "pages/verifyEmail", {user: user, active: "", ok:true,strings:strings,lang:req.lang});
          });
        }
      });
    }
  });
};

exports.getRandomProfilePic = function(callback) {
  var height = 1000;
  var width = 5000;
  var theme_poss = ["sugarsweets","heatwave","daisygarden","seascape","summerwarmth","bythepool","duskfalling","frogideas","berrypie"];
  var theme = theme_poss[Math.floor(Math.random() * theme_poss.length)]; //["sugarsweets","heatwave","daisygarden","seascape","summerwarmth","bythepool","duskfalling","frogideas","berrypie"]
  var type = "squares"; //["squares","isogrids"]
  var numColors = 4;
  var numTriangles = 20; //isogrids xt
  var numSquares = 20; //squares xs

  var options = {
    host: "www.tinygraphs.com",
    path: "/"+type+"/banner/random?theme="+theme+"&h="+height+"&w="+width+"&numcolors="+numColors+"&xs="+numTriangles+"&fmt=svg",
    //https://www.tinygraphs.com/squares/banner/random?theme=bythepool&h=100&w=150&numcolors=4&fmt=svg&xs=20
    port: 443,
    headers: {'User-Agent': 'Custom Header Demo works'}
  };
  https.get(options, function(response) {
    var str = '';

    //another chunk of data has been received, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been received, so we just print it out here
    response.on('end', function () {
      str = str.replace(/fill:/g,"");
      str = str.replace(/style=/g,"fill=");
      callback(str);
    });
  });
};

exports.getProfilePic = function(req,res) {
  var user = service.getUserFromToken(req.cookies.Token);
  User.findOne({username: user}, function(err_find, usr) {
    if(err_find) return res.status(200).json({ok: false});
    if(usr) res.status(200).json({ok: true, svg:usr.profile_pic});
    //var svgImage = new Buffer.from(usr.profile_pic,'base64').toString("ascii");
    //console.log(svgImage);
    else res.status(200).json({ok: false});
  });
};

exports.getProfilePicFromUser = function(req,res) {
  var user = req.params.usr;
  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false});
  }

  User.findOne({username: user}, function(err_find, usr) {
    if(err_find) return res.status(200).json({ok: false});
    if(usr) res.status(200).json({ok: true, svg:usr.profile_pic});
    else res.status(200).json({ok: false});
  });
};

exports.getUserProfile = function(req,res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var username = req.params.username;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/error", {user: user,active: "",strings:strings,lang:req.lang});
  }

  User.findOne({username:username}, function(err_find, usr) {
    if(err_find) return res.render(vPath + "pages/error", {user: user,active: "",strings:strings,lang:req.lang});
    if(usr){
      Projectes.find({creator:username}, function(err_find_proj, pojects) {
        if(err_find_proj) return res.render(vPath + "pages/error", {user: user,active: "",strings:strings,lang:req.lang});
        Award.find({creator:username}, function(err_award, awards) {
          if(err_award) return res.render(vPath + "pages/error", {user: user,active: "",strings:strings,lang:req.lang});
          res.render(vPath + "pages/userInfo",{user:user,active:"explora",strings:strings,lang:req.lang,profileInfo:usr,addedProjects:pojects,givenAwards:awards});
        });
      });
    }
    else res.render(vPath + "pages/error", {user: user,active: "",strings:strings,lang:req.lang});
  });
};

exports.updateEmail = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var newEmail = req.body.newEmail;
  var email = req.body.email;
  var password = req.body.password;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
  }

  if(email==newEmail) return res.status(200).json({ok: false, msg:strings["errors"]["error_email_actualitzat_iguals"][req.lang]});

  User.findOne({email: newEmail}, function(err_find_email, email_user) {
    if(err_find_email) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
    if(email_user) return res.status(200).json({ok: false, msg:strings["errors"]["error_email_usat"][req.lang]});
    User.findOne({username: user}, function(err_find, usr) {
      if(err_find) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
      var hash = usr.pass;
      bcrypt.compare(password, hash, function(err_hash, result) {
        if(err_hash) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
        if(result) {
          crypto.randomBytes(20, function(err_token, buf) {
            if(err_token) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
            var token = buf.toString('hex');

            var change = new ChangeEmail({
              user:      user,
              newEmail:  newEmail,
              token:     token,
              expire:    Date.now()+3600000
            });

            change.save(function(err, chng) {
              if(err) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
              if(chng) {
                service.sendMail(newEmail,"changeEmail",token, function(result) {
                  if(result) res.status(200).json({ok: true, msg:strings["perfil"]["email_modificat"][req.lang]});
                  return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
                });
              }
              else return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
            });
          });
        }
        else return res.status(200).json({ok: false, msg:strings["errors"]["error_pass_incorrecta"][req.lang]});
      });
    });
  });
};

exports.verifyUpdateEmail = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var token = req.params.token;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/verifyChangeEmail", {user: user, active: "", ok:false,strings:strings,lang:req.lang});
  }

  ChangeEmail.findOne({ token: token, expire: { $gt: Date.now() } }, function(err_find, chng) {
    if(err_find) return res.render(vPath + "pages/verifyChangeEmail", {user: user, active: "", ok:false,strings:strings,lang:req.lang});
    if(!chng) res.render(vPath + "pages/verifyChangeEmail", {user: user, active: "", ok:false,strings:strings,lang:req.lang});
    else {
      console.log(chng);
      User.updateOne({username: chng.user}, {email:chng.newEmail}, function(err_update_usr, usr) {
        if(err_update_usr) {
          res.render(vPath + "pages/verifyChangeEmail", {user: user, active: "", ok:false,strings:strings,lang:req.lang});
        } else {
          ChangeEmail.updateOne({token: token}, {expire: Date.now()-3600000}, function(err_update_chng, rec) {
            if(err_update_chng) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
            res.render(vPath + "pages/verifyChangeEmail", {user: user, active: "", ok:true,strings:strings,lang:req.lang});
          });
        }
      });
    }
  });
};
