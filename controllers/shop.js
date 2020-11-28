var mongoose = require('mongoose');
var Projectes  = mongoose.model('Project');
var User  = mongoose.model('User');
var Comment  = mongoose.model('Comment');
var Activity  = mongoose.model('Activity');
var Award = mongoose.model('Award');
var Profile = require('./profile');
var vPath = __dirname + '/../views/'
var service = require('../services');
var fs = require('fs');
var strings = JSON.parse(fs.readFileSync(__dirname + '/../views/resources/lang/strings.json', 'utf8'));

const { validationResult } = require('express-validator');


exports.changeProfilePicGet = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);

  User.findOne({username:user}, function(err_usr, usr) {
    if(err_usr) res.status(200).json({ok: false,msg:strings['errors']['error_general'][req.lang]});
    res.status(200).json({ok: true,points:1000,msg:strings['botiga']['gastar'][req.lang]});
  });
}

exports.changeProfilePicPost = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var cost = 100;

  User.findOne({username: user}, function(err_user, u) {
    if(err_user) return res.status(200).json({ok: false,msg:strings['errors']['error_general'][req.lang]});
    Projectes.aggregate([
      {$match: {_id:{$in: u.addedProj}}},
      {$group: {_id: null, sumProjAdded: {$sum: "$numRates"},sumProjSaved: {$sum: "$numSaves"}}}
    ]).exec(function(err_proj, proj) {
      if(err_proj) return res.status(200).json({ok: false,msg:strings['errors']['error_general'][req.lang]});
      if(Object.keys(proj).length!==0) {
        var total = proj[0]['sumProjAdded']+proj[0]['sumProjSaved'];
        if((total-u.spentPoints-cost)>=0) {
          Profile.getRandomProfilePic(function(svgImage) {
            var svgImage_b = new Buffer.from(svgImage).toString('base64');
            User.updateOne({username: user}, {profile_pic:svgImage_b, $inc:{spentPoints:100}}, function(err_update, usr_update) {
              if(err_update) res.status(200).json({ok: false,msg:strings['errors']['error_general'][req.lang]});
              res.status(200).json({ok: true, msg:strings['botiga']['operacio_finalitzada'][req.lang]});
            });
          });
        }
        else res.status(200).json({ok: false, msg:strings['botiga']['punts_insuficients'][req.lang]});
      }
      else {
        res.status(200).json({ok: false, msg:strings['botiga']['punts_insuficients'][req.lang]});
      }
    });
  });

}

exports.giveAward = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var project = req.body.proj;
  var award = req.body.award;

  var cost = {"silver": 200, "golden": 400, "diamond": 800};

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
  }

  Projectes.findOne({_id:project,creator:{$ne:user}},function(err_proj,proj) {
    if(err_proj) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
    if(proj != null) {
      Profile.getUserPointsExt(user, function(points) {
        if(points<0) return res.status(200).json({ok: false, msg:strings["botiga"]["punts_insuficients"][req.lang]});
        if((points-cost[award])>=0) {
          var newAward = new Award({
            creator:  user,
            project:  project,
            award:    award,
            date:     new Date()
          });
          newAward.save(function(err_saveAw, aw) {
            if(err_saveAw) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
            User.updateOne({username: user}, {$inc:{spentPoints:cost[award]}}, function(err_update, usr_update) {
              if(err_update) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
              var activity = new Activity({
                creator:      user,
                actType:      "projectAward",
                referenceId:  project,
                body:         proj.title,
                date:         new Date()
              });
              activity.save(function(err_act_save, act) {
                if(err_act_save) return res.status(200).json({ok: false});
                return res.status(200).json({ok: true});
              });
            });
          });
        }
        else return res.status(200).json({ok: false, msg:strings["botiga"]["punts_insuficients"][req.lang]});
      });
    }
    else return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
  });
}
