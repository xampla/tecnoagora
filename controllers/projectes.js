var mongoose = require('mongoose');
var he = require('he');
var Projectes  = mongoose.model('Project');
var User  = mongoose.model('User');
var Comment  = mongoose.model('Comment');
var Activity  = mongoose.model('Activity');
var Award = mongoose.model('Award');
var vPath = __dirname + '/../views/'
var service = require('../services');
var fs = require('fs');
const https = require('https');
const querystring = require('querystring');
var strings = JSON.parse(fs.readFileSync(__dirname + '/../views/resources/lang/strings.json', 'utf8'));
var md = require('markdown-it')({
  html: false,
  linkify: true,
  typographer: true
}).use(require('markdown-it-imsize'));

var defaultRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.table_open = function(tokens, idx) {
  return '<table class="table table-striped">';
};
/*md.renderer.rules.tr_open = function(tokens, idx) {
  return '<tr class="d-flex d-wrap">';
};*/
md.renderer.rules.blockquote_open = function(tokens, idx) {
  return '<blockquote class="blockquote">';
};
md.renderer.rules.image = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex('class');

  if (aIndex < 0) {
    tokens[idx].attrPush(['class', 'img-fluid']); // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = 'img-fluid';    // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

const { validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');

exports.findAllProjects = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var page = (req.query.p) ? parseInt(req.query.p):1;
  var pages = {actual:'', prev:'',next:'',total:''};

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
  }

  Projectes.countDocuments(function(err_count, countProj) {
    if(err_count) return res.render(vPath + "pages/error", {user: error, active: "",strings:strings,lang:req.lang});
    pages['total'] = (countProj%10 == 0 && countProj != 0) ? countProj/10 : parseInt(countProj/10)+1;
    //pages['actual'] = (page==null || page==0 || parseInt(req.query.p)>pages.total) ? 1: parseInt(req.query.p);
    pages['actual'] = (page>pages.total) ? 1: page;
    pages['next'] = (pages.actual+1>=pages.total) ? pages.total : pages.actual+1;
    pages['prev'] = (pages.actual-1<=0 || pages.actual>pages.total) ? 1:pages.actual-1;
    Projectes.find({}).sort({ date: -1 }).skip(10*(pages.actual-1)).limit(10).exec(function(err_find, projects) {
      if(err_find) return res.status(200).render(vPath + "pages/error", {user: user, active: "explora",strings:strings,lang:req.lang});
      for (var i = 0; i < projects.length; i++) {
        projects[i].descBig = md.render(projects[i].descBig);
      }
      if(user!="Usuari") {
        User.findOne({username: user}, function(err_user, usr){
          if(err_user) return res.status(200).render(vPath + "pages/error", {user: user, active: "explora",strings:strings,lang:req.lang});
          res.status(200).render(vPath + "pages/explora", {data: projects, rated:usr.ratedProj, user: user, active: "explora", page:pages,strings:strings,lang:req.lang});
        });
      }
      else {
        res.status(200).render(vPath + "pages/explora", {data: projects, rated:"", user: user, active: "explora", page:pages,strings:strings,lang:req.lang});
      }
    });
  });
};

exports.exempleMarkDown = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var exemple = fs.readFileSync(__dirname + '/../views/resources/others/exempleMarkDown_'+req.lang, 'utf8');
  var exemple_split_rendered = md.render(exemple).split(";-;");
  res.render(vPath + "pages/exempleMarkDown", {user: user, active: "",strings:strings,render:exemple_split_rendered,lang:req.lang});
};

exports.addProject = function(req, res) {
    var user = service.getUserFromToken(req.cookies.Token);
    var tags = req.body.tags.split(",");
    var title = req.body.title;
    var descSmall = req.body.descSmall;
    var descBig = req.body.descBig;
    var link = req.body.link;
    var linkWeb = req.body.linkWeb;

    var errorSanitize = validationResult(req);
    if(!errorSanitize.isEmpty()) {
      console.log(errorSanitize);
      return res.status(200).json({ok: false, msg:strings["errors"]["error_format_afegir_projecte"][req.lang]});
    }

    if(tags.length<1) return res.status(200).json({ok: false, msg:strings["errors"]["error_tags_insuficients"][req.lang]});
    if(tags.length >12) return res.status(200).json({ok: false, msg:strings["errors"]["error_tags_excedits"][req.lang]});

    var projecte = new Projectes({
        title:      title,
        descSmall:  descSmall,
        descBig:    descBig,
        link:       link,
        linkWeb:    linkWeb,
        creator:    user,
        numRates:     0,
        numSaves:     0,
        tags:       tags,
        date:       new Date(),
        lastUpdate: new Date()
    });
    projecte.save(function(err_save, project) {
      if(err_save) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
      User.updateOne({username: user},{$push:{addedProj:project._id}}, function(err_update, usr) {
        if(err_update) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
        var activity = new Activity({
          creator:      user,
          actType:      "projectAdded",
          referenceId:  project._id,
          body:         project.descSmall,
          date:         new Date()
        });
        activity.save(function(err_act, act) {
          if(err_act) return res.status(200).json({ok: false, msg:strings["errors"]["error_general"][req.lang]});
          res.status(200).json({ok: true, msg:strings["afegir"]["projecte_afegit"][req.lang], id:project._id});
        });
      });
    });
};

exports.getProjectDetails = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var id = req.params.id;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
  }

  Projectes.findById(id, function(err_find_proj, projecte) {
    if(err_find_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    if(projecte != null){
      Comment.find({_id: {$in: projecte.comments}}, function(err_find_comm, comments) {
        if(err_find_comm) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
        projecte.descBig = md.render(projecte.descBig);
        User.findOne({username: user, addedProj:{$in: id}}, function(err_own, usr) {
          if(err_own) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
          var owner = (usr!=null)
          User.findOne({username: user, ratedProj:{$in: id}}, function(err_rate, usrRate) {
            if(err_rate) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
            var rated = (usrRate!=null)
            User.findOne({username: user, savedProj:{$in: id}}, function(err_save, usrSave) {
              if(err_save) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
              Award.find({project:id}, function(err_award, awards) {
                if(err_award) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
                var saved = (usrSave!=null)
                res.status(200).render(vPath + "pages/infoProjecte", {proj: projecte, user: user, active: "explora", comment: comments, rated: rated, saved: saved, owner: owner,strings:strings,lang:req.lang,receivedAwards:awards});
              });
            });
          });
        });
      });
    }
    else {
      return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    }
  });
};

exports.addCommentToProject = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var id = req.params.id;
  var body = req.body.desc;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false});
  }

  var com = new Comment({
    project:    id,
    body:       body,
    creator:    user,
    points:     0,
    date:       new Date()
  });
  com.save(function(err_save_com, comment) {
    if(err_save_com) return res.status(200).json({ok:false});
    Projectes.updateOne({_id: req.params.id},{$push:{comments:comment._id}}, function(err_update_proj, project) {
      if(err_update_proj) return res.status(200).json({ok:false});
      User.updateOne({username: user},{$push:{comments:comment._id}}, function(err_update_user, usr) {
        if(err_update_user) return res.status(200).json({ok:false});
        var activity = new Activity({
          creator:      user,
          actType:      "projectCommented",
          referenceId:  id,
          body:         comment.body,
          date:         new Date()
        });
        activity.save(function(err_save_act, act) {
          if(err_save_act) return res.status(200).json({ok:false});
          res.status(200).json({ok:true, comment:comment.body, creator: comment.creator, date:comment.date});
        });
      });
    });
  });
};

exports.addRateToProject = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var id = req.params.id;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false});
  }

  User.updateOne({username: user, ratedProj:{$nin: id}},{$push:{ratedProj:id}}, function(err_update_user, mod) {
    if(err_update_user) return res.status(200).json({ok: false});
    if(mod['nModified']!=0){
      Projectes.findOneAndUpdate({_id: id},{$inc:{numRates:1}},{new: true}, function(err_update_proj, proj) {
        if(err_update_proj) return res.status(200).json({ok: false});
        Activity.findOne({creator:user,actType:"projectRated",referenceId:id,body: proj.title}, function(err_find_act, act){
          if(err_find_act) return res.status(200).json({ok: false});
          if(!act) {
            var activity = new Activity({
              creator:      user,
              actType:      "projectRated",
              referenceId:  id,
              body:         proj.title,
              date:         new Date()
            });
            activity.save(function(err_save_act, act) {
              if(err_save_act) return res.status(200).json({ok: false});
              res.status(200).json({ok:true, points:proj.numRates});
            });
          }
          else {
            res.status(200).json({ok:true, points:proj.numRates});
          }
        });
      });
    }
    else {
      res.status(200).json({ok:false, points:-1});
    }
  });
};

exports.removeRateFromProject = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var id = req.params.id;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.status(200).json({ok: false});
  }

  User.updateOne({username: user, ratedProj:{$in: id}},{$pull:{ratedProj:id}}, function(err_update_user, mod) {
    if(err_update_user) return res.status(200).json({ok: false});
    if(mod['nModified']!=0){
      Projectes.findOneAndUpdate({_id: id},{$inc:{numRates:-1}},{new: true}, function(err_update_proj, project) {
        if(err_update_proj) return res.status(200).json({ok: false});
        res.status(200).json({ok:true, points:project.numRates});
      });
    }
    else {
      res.status(200).json({ok:false, points:-1});
    }
  });
};

exports.deleteProject = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var id = req.params.id;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
  }

  Projectes.findOne({_id: id, creator: user}, function(err_find_proj, project) {
    if(err_find_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    if(project != null) {
      project.remove(function(err_remove) {
        if(err_remove) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
        User.updateOne({username: user, addedProj:{$in: id}},{$pull:{addedProj:id}}, function(err_update_user, mod) {
          if(err_update_user) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
          if(mod['nModified']!=0){
            var activity = new Activity({
              creator:      user,
              actType:      "projectDeleted",
              referenceId:  id,
              body:         project.title,
              date:         new Date()
            });
            activity.save(function(err_save_act, act) {
              if(err_update_user)
              res.status(200).redirect('/explora?p=0');
            });
          }
          else return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
        });
      });
    }
    else {
        res.status(200).redirect('/');
    }
  });
};


exports.trendingProjects = function(req, res) {

  Projectes.aggregate([{$match:{numRates:{$gt: 0}}},{$sample:{size:5}}]).limit(5).exec(function(err, projects) {
    if(err) res.status(200).json({ok: false});
    res.status(200).json({ok: true, trending:projects});
  });
};

exports.discoverProjects = function(req, res) {
  //TODO: make it more personalized
  Projectes.aggregate([ { $sample: { size: 3 } } ]).exec(function(err, projects) {
    if(err) res.status(200).json({ok: false, msg:strings["activitat"]["no_disponible"][req.lang]});
    res.status(200).json({ok: true, discover:projects, msg:strings["explora"]["saber_mes"][req.lang]});
  });
};

exports.searchProjects = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var search = req.query.search;
  var page = req.query.p;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
  }


  Projectes.countDocuments({$text:{ $search: search }}, function(err_cnt_proj, countProj){
    if(err_cnt_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    var pages = {actual:'', prev:'',next:'',total:''};
    pages['total'] = (countProj%10 == 0 && countProj != 0) ? countProj/10 : parseInt(countProj/10)+1;
    pages['actual'] = (page==null || page==0 || parseInt(page)>pages.total) ? 1: parseInt(page);
    pages['next'] = (pages.actual+1>=pages.total) ? pages.total : pages.actual+1;
    pages['prev'] = (pages.actual-1<=0 || pages.actual>pages.total) ? 1:pages.actual-1;
    Projectes.find({$text:{ $search: search }}).skip(10*(pages.actual-1)).limit(10).exec(function(err_find_proj, projects) {
      if(err_find_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
      if(projects == null) {
        projects=''
      }else {
        for (i = 0; i < projects.length; i++) {
          projects[i].descBig = md.render(projects[i].descBig);
        }
      }
      if(user!="Usuari") {
        User.findOne({username: user}, function(err_user, usr){
          if(err_user) return res.status(200).render(vPath + "pages/error", {user: user, active: "explora",strings:strings,lang:req.lang});
          res.status(200).render(vPath + "pages/search", {data: projects, user: user, active: "explora",rated:usr.ratedProj, page: pages,sortBy:"millor_res", term: search,strings:strings,lang:req.lang});
        });
      }
      else {
        res.status(200).render(vPath + "pages/search", {data: projects, user: user, active: "explora",rated:"", page: pages,sortBy:"millor_res", term: search,strings:strings,lang:req.lang});
      }
    });
  });
};

exports.sortSearchedProjects = function(req, res) {
  var searchType = req.query.searchType;
  var searchedTerm = req.query.searchedTerm;
  var pages = {actual:'', prev:'',next:'',total:''};
  var user = service.getUserFromToken(req.cookies.Token);

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
  }

  Projectes.countDocuments({$text:{ $search: searchedTerm }}, function(err_count_proj, countProj){
    if(err_count_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    pages['total'] = (countProj%10 == 0 && countProj != 0) ? countProj/10 : parseInt(countProj/10)+1;
    pages['actual'] = (req.query.p==null || parseInt(req.query.p)>pages.total) ? 1: parseInt(req.query.p);
    pages['next'] = (pages.actual+1>=pages.total) ? pages.total : pages.actual+1;
    pages['prev'] = (pages.actual-1<=0 || pages.actual>pages.total) ? 1:pages.actual-1;
    switch (searchType) {
      case "mostRated":
        Projectes.find({$text:{ $search: searchedTerm }}).sort({ numRates: -1 }).exec(function(err_proj, projects) {
          if(err_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
          for (i = 0; i < projects.length; i++) {
            projects[i].descBig = md.render(projects[i].descBig);
          }
          if(user!="Usuari") {
            User.findOne({username: user}, function(err_user, usr) {
              if(err_user) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
              res.status(200).render(vPath + "pages/sub_search", {data: projects, rated: usr.ratedProj,page: pages,sortBy:"millor_val",term:searchedTerm,strings:strings,lang:req.lang});
            });
          }
          else res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:"", page: pages,sortBy:"millor_val",term:searchedTerm,strings:strings,lang:req.lang});
        });
        break;
      case "leastRated":
        Projectes.find({$text:{ $search: searchedTerm }}).sort({ numRates: 1 }).exec(function(err_proj, projects) {
          if(err_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
          for (i = 0; i < projects.length; i++) {
            projects[i].descBig = md.render(projects[i].descBig);
          }
          if(user!="Usuari") {
            User.findOne({username: user}, function(err_user, usr) {
              if(err_user) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
              res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:usr.ratedProj, page: pages,sortBy:"menys_val",term:searchedTerm,strings:strings,lang:req.lang});
            });
          }
          else res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:"", page: pages,sortBy:"menys_val",term:searchedTerm,strings:strings,lang:req.lang});
        });
        break;
      case "recentlyUpdated":
        Projectes.find({$text:{ $search: searchedTerm }}).sort({ lastUpdate: -1 }).exec(function(err_proj, projects) {
          if(err_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
          for (i = 0; i < projects.length; i++) {
            projects[i].descBig = md.render(projects[i].descBig);
          }
          if(user!="Usuari") {
            User.findOne({username: user}, function(err_user, usr) {
              if(err_user) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
              res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:usr.ratedProj, page: pages,sortBy:"recent_act",term:searchedTerm,strings:strings,lang:req.lang});
            });
          }
          else res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:"", page: pages,sortBy:"recent_act",term:searchedTerm,strings:strings,lang:req.lang});
        });
        break;
      case "leastRecentlyUpdated":
        Projectes.find({$text:{ $search: searchedTerm }}).sort({ lastUpdate: 1 }).exec(function(err_proj, projects) {
          if(err_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
          for (i = 0; i < projects.length; i++) {
            projects[i].descBig = md.render(projects[i].descBig);
          }
          if(user!="Usuari") {
            User.findOne({username: user}, function(err_user, usr) {
              if(err_user) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
              res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:usr.ratedProj, page: pages,sortBy:"menys_act",term:searchedTerm,strings:strings,lang:req.lang});
            });
          }
          else res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:"", page: pages,sortBy:"menys_act",term:searchedTerm,strings:strings,lang:req.lang});
        });
        break;
      default:
        Projectes.find({$text:{ $search: searchedTerm }}, function(err_proj, projects) {
          if(err_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
          for (i = 0; i < projects.length; i++) {
            projects[i].descBig = md.render(projects[i].descBig);
          }
          if(user!="Usuari") {
            User.findOne({username: user}, function(err_user, usr) {
              if(err_user) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
              res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:usr.ratedProj, page: pages,sortBy:"millor_res",term:searchedTerm,strings:strings,lang:req.lang});
            });
          }
          else res.status(200).render(vPath + "pages/sub_search", {data: projects, rated:"", page: pages,sortBy:"millor_res",term:searchedTerm,strings:strings,lang:req.lang});
        });
    }
  });
};

exports.previewContent = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var content = req.body.content;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.status(200).json({ok: false});
  }

  var pre = md.render(content);
  res.status(200).json({ok: true, preview:pre, user:user, msg: strings["infoProj"]["compartit_per"][req.lang]});
};

exports.getEditProject = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var id = req.params.id;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
  }

  Projectes.findOne({_id:id, creator:user}, function(err_proj, proj){
    if(err_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    if(proj != null) {
      res.status(200).render(vPath + "pages/editProject", {data: proj, user: user, active: "explora",strings:strings,lang:req.lang});
    }
  });
}

exports.updateProject = function(req, res) {
  var user = service.getUserFromToken(req.cookies.Token);
  var id = req.params.id;
  var title = req.body.title;
  var descSmall = req.body.descSmall
  var descBig = req.body.descBig;
  var link = req.body.link;
  var linkWeb = req.body.linkWeb;
  var tags = req.body.tags;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
  }

  Projectes.updateOne({_id:id, creator:user},{$set:{title: title,descSmall: descSmall,descBig: descBig,link: link,linkWeb: linkWeb,tags:tags.split(","),lastUpdate: new Date()}} ,function(err_proj, proj){
    if(err_proj) return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    if(proj['nModified']!=0) {
      res.status(200).redirect("/projects/"+id);
    }
    else {
      return res.render(vPath + "pages/error", {user: user, active: "",strings:strings,lang:req.lang});
    }
  });
}

exports.getProjectIssues = function(req,res) {
  var id = req.params.id;

  var errorSanitize = validationResult(req);
  if(!errorSanitize.isEmpty()) {
    console.log(errorSanitize);
    return res.json({ok:false,msg:strings["general"]["empty_issues"][req.lang]});
  }

  Projectes.findOne({_id:id}, function(err_proj, proj){
    if(err_proj) return res.json({ok:false,msg:strings["general"]["empty_issues"][req.lang]});
    if(!proj) {return res.json({ok:false,msg:strings["general"]["empty_issues"][req.lang]});}
    else {
      var host = new URL(he.decode(proj.link));
      var general = "";
      var tecno_label = "";
      if(host.host=="github.com") {
        var options = {
          host: host.hostname,
          path: host.pathname+"/issues",
          port: 443,
          headers: {'User-Agent': 'Mozilla/5.0 Gecko/20100101 Firefox/84.0'}
        };
        https.get(options, function(response) {
          var str = '';

          //another chunk of data has been received, so append it to `str`
          response.on('data', function (chunk) {
            str += chunk;
          });

          //the whole response has been received, so we just print it out here
          response.on('end', function () {
            general = str.substring(str.lastIndexOf('<div class="Box mt-3 Box--responsive hx_Box--firstRowRounded0">'), str.lastIndexOf('</div>'));

            options = {
              host: host.hostname,
              path: host.pathname+"/issues?q=+label:TecnoAgora+",
              port: 443,
              headers: {'User-Agent': 'Mozilla/5.0 Gecko/20100101 Firefox/84.0'}
            };

            https.get(options, function(response) {
              var str_2 = '';

              //another chunk of data has been received, so append it to `str`
              response.on('data', function (chunk) {
                str_2 += chunk;
              });

              //the whole response has been received, so we just print it out here
              response.on('end', function () {
                tecno_label = str_2.substring(str_2.lastIndexOf('<div class="Box mt-3 Box--responsive hx_Box--firstRowRounded0">'), str_2.lastIndexOf('</div>'));
                general = str.substring(str.lastIndexOf('<div class="Box mt-3 Box--responsive hx_Box--firstRowRounded0">'), str.lastIndexOf('</div>'));
                if(tecno_label.includes('js-issue-row')) {
                  if(proj.label) return res.status(200).json({ok:true, general:general,tecno_label:tecno_label, msg:strings["general"]["empty_issues"][req.lang],type:"github"});
                  else {
                    Projectes.updateOne({_id:id},{$set:{label:true}}, function(err_update, proj_update) {
                      res.status(200).json({ok:true, general:general,tecno_label:tecno_label, msg:strings["general"]["empty_issues"][req.lang],type:"github"});
                    })
                  }
                }
                else {
                  res.status(200).json({ok:true, general:general,tecno_label:tecno_label, msg:strings["general"]["empty_issues"][req.lang],type:"github"});
                }
              });
            });
          });
        });
      }
      else if(host.host=="gitlab.com") {
        var options = {
          host: host.hostname,
          path: host.pathname+"/-/issues",
          port: 443,
          headers: {'User-Agent': 'Mozilla/5.0 Gecko/20100101 Firefox/84.0'}
        };
        https.get(options, function(response) {
          var str = '';

          //another chunk of data has been received, so append it to `str`
          response.on('data', function (chunk) {
            str += chunk;
          });

          //the whole response has been received, so we just print it out here
          response.on('end', function () {
            general = str.substring(str.lastIndexOf('<div class="Box mt-3 Box--responsive hx_Box--firstRowRounded0">'), str.lastIndexOf('</div>'));

            options = {
              host: host.hostname,
              path: host.pathname+"/-/issues?scope=all&state=all&label_name[]=TecnoAgora",
              port: 443,
              headers: {'User-Agent': 'Mozilla/5.0 Gecko/20100101 Firefox/84.0'}
            };

            https.get(options, function(response) {
              var str_2 = '';

              //another chunk of data has been received, so append it to `str`
              response.on('data', function (chunk) {
                str_2 += chunk;
              });

              //the whole response has been received, so we just print it out here
              response.on('end', function () {
                tecno_label = str_2.substring(str_2.lastIndexOf('<ul class="content-list issues-list issuable-list">'), str_2.lastIndexOf('</ul>'));
                general = str.substring(str.lastIndexOf('<ul class="content-list issues-list issuable-list">'), str.lastIndexOf('</ul>'));
                if(!tecno_label.includes('Sorry, your filter produced no results')) res.status(200).json({ok:true, general:general,tecno_label:tecno_label, msg:strings["general"]["empty_issues"][req.lang],type:"gitlab"});
                else if(tecno_label.includes('issues')) {
                  if(proj.label) return res.status(200).json({ok:true, general:general,tecno_label:tecno_label, msg:strings["general"]["empty_issues"][req.lang],type:"gitlab"});
                  else {
                    Projectes.updateOne({_id:id},{$set:{label:true}}, function(err_update, proj_update) {
                      res.status(200).json({ok:true, general:general,tecno_label:tecno_label, msg:strings["general"]["empty_issues"][req.lang],type:"gitlab"});
                    })
                  }
                }
                else {
                  res.status(200).json({ok:true, general:general,tecno_label:tecno_label, msg:strings["general"]["empty_issues"][req.lang],type:"gitlab"});
                }
              });
            });
          });
        });
      }
      else {
        return res.json({ok:false,msg:strings["general"]["empty_issues"][req.lang]});
      }
    }
  });
}
