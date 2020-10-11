var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var methodOverride = require("method-override");
var projectModel = require('./models/projectSchema');
var userModel = require('./models/userSchema');
var activityModel = require('./models/activitySchema');
var commentModel = require('./models/commentSchema');
var contactModel = require('./models/contactSchema');
var recoverPassModel = require('./models/recoverPassSchema');
var verifyEmailModel = require('./models/verifyEmailSchema');
var changeEmailModel = require('./models/changeEmailSchema');
var ProjectCtrl = require('./controllers/projectes');
var Auth = require('./controllers/auth');
var Menu = require('./controllers/menu');
var Profile = require('./controllers/profile');
var vPath = __dirname + '/views/'
var middlAuth = require('./middleware/middleAuth');
var middlGeneral = require('./middleware/middleGeneral');
var config = require('./config');
var jwt = require('jwt-simple');
var helmet = require('helmet');
const { body, param, query } = require('express-validator');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser());
app.use(helmet());
app.use(middlGeneral.language);
app.use("/src", express.static(__dirname + '/views/resources/'));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", 'stackpath.bootstrapcdn.com'],
    scriptSrc: ["'self'", 'ajax.googleapis.com','stackpath.bootstrapcdn.com','cdn.jsdelivr.net'],
  }
}));

app.set('view engine', 'ejs');

// API routes
var projects = express.Router();

projects.get('/', Menu.home);
projects.get('/afegirEntrada',middlAuth.ensureAuthenticated, Menu.addEntry);
projects.get('/unirse',middlAuth.ensureNotAuthenticated, Menu.join);
projects.get('/logout', Menu.logout);
projects.get('/faqs', Menu.faqs);
projects.get('/cookiePolicy', Menu.cookiePolicy);
projects.get('/privacyPolicy', Menu.privacyPolicy);
projects.get('/termsAndConditions', Menu.termsAndConditions);
projects.get('/contact', Menu.contact);
projects.get('/error', Menu.error);
projects.post('/sendContact',[
  body('name').not().isEmpty().trim().isLength({max: 50}).escape(),
  body('surname').not().isEmpty().isLength({max: 50}).trim(),
  body('email').not().isEmpty().trim().isEmail().normalizeEmail().isLength({max: 100}),
  body('desc').not().isEmpty().trim().escape()
], Menu.sendContact);
projects.get('/changeLang',[query('lang').not().isEmpty().trim().isIn(['cat','es','en'])], Menu.changeLang);


projects.get('/explora', ProjectCtrl.findAllProjects);
projects.get('/projects', ProjectCtrl.findAllProjects);
projects.post('/afegirEntrada',[
  middlAuth.ensureAuthenticated,
  body('title').not().isEmpty().trim().isLength({max: 50}).escape(),
  body('descSmall').not().isEmpty().trim().isLength({max: 500}).escape(),
  body('descBig').not().isEmpty().trim().isLength({max: 10000000}).escape(),
  body('link').not().isEmpty().trim().isLength({max: 100}).escape(),
  body('linkWeb').trim().isLength({max: 100}).escape(),
  body('tags').not().isEmpty().trim().isLength({max: 3000}).escape()
], ProjectCtrl.addProject);
projects.get('/projects/:id',[param('id').not().isEmpty().trim().isMongoId()], ProjectCtrl.getProjectDetails);
projects.post('/addComment/:id',[
  middlAuth.ensureAuthenticated,
  param('id').not().isEmpty().trim().isMongoId(),
  body('desc').not().isEmpty().trim().isLength({max: 300}).escape(),
], ProjectCtrl.addCommentToProject);
projects.post('/rateProj/:id',[middlAuth.ensureAuthenticated,param('id').not().isEmpty().trim().isMongoId()], ProjectCtrl.addRateToProject);
projects.post('/unrateProj/:id',[middlAuth.ensureAuthenticated,param('id').not().isEmpty().trim().isMongoId()], ProjectCtrl.removeRateFromProject);
projects.post('/deleteProject/:id',[middlAuth.ensureAuthenticated,param('id').not().isEmpty().trim().isMongoId()], ProjectCtrl.deleteProject);
projects.post('/preview',[middlAuth.ensureAuthenticated,body('content').not().isEmpty().trim().isLength({max: 10000000}).escape()], ProjectCtrl.previewContent);
projects.get('/projectesTendencia', ProjectCtrl.trendingProjects);
projects.get('/discoverProjects',middlAuth.ensureAuthenticated, ProjectCtrl.discoverProjects);
projects.get('/editProject/:id', [middlAuth.ensureAuthenticated,param('id').not().isEmpty().trim().isMongoId()], ProjectCtrl.getEditProject);
projects.post('/updateProject/:id', [
  middlAuth.ensureAuthenticated,
  param('id').not().isEmpty().trim().isMongoId(),
  body('title').not().isEmpty().trim().isLength({max: 50}).escape(),
  body('descSmall').not().isEmpty().trim().isLength({max: 500}).escape(),
  body('descBig').not().isEmpty().trim().isLength({max: 10000000}).escape(),
  body('link').not().isEmpty().trim().isLength({max: 100}).escape(),
  body('linkWeb').trim().isLength({max: 100}).escape(),
  body('tags').not().isEmpty().trim().isLength({max: 3000}).escape()
], ProjectCtrl.updateProject);
projects.get('/search',[
  query('search').trim().escape(),
  query('p').not().isEmpty().trim().isInt()
], ProjectCtrl.searchProjects);
projects.get('/sortSearch',[
  query('searchType').not().isEmpty().trim().escape(),
  query('searchedTerm').trim().isLength({max: 25}).escape(),
], ProjectCtrl.sortSearchedProjects);

projects.post('/unirse', [
  middlAuth.ensureNotAuthenticated,
  body('name').not().isEmpty().trim().isLength({max: 50}).escape(),
  body('surname').not().isEmpty().trim().isLength({max: 50}).escape(),
  body('username').not().isEmpty().trim().isLength({max: 39}).escape(),
  body('pass').not().isEmpty().trim().isLength({min:8,max: 128}).escape(),
  body('email').not().isEmpty().trim().isEmail().normalizeEmail().isLength({max: 100}),
  body('socialLink').trim().isLength({max: 100}).escape(),
  body('description').not().isEmpty().isLength({max: 160}).trim().escape()
], Auth.emailSignup);
projects.post('/login', [
  middlAuth.ensureNotAuthenticated,
  body('email').not().isEmpty().trim().isEmail().normalizeEmail().isLength({max: 100}),
  body('pass').not().isEmpty().isLength({max: 128}),
], Auth.emailLogin);
projects.get('/login', middlAuth.ensureNotAuthenticated, Auth.login);
projects.get('/forgotPassword', middlAuth.ensureNotAuthenticated, Auth.forgotPasswordGet);
projects.post('/forgotPassword', [
  middlAuth.ensureNotAuthenticated,
  body('email').not().isEmpty().trim().isEmail().normalizeEmail().isLength({max: 100}),
], Auth.forgotPasswordPost);
projects.get('/recoverPassword/:token', [middlAuth.ensureNotAuthenticated, param('token').not().isEmpty().trim()], Auth.recoverPasswordGet);
projects.post('/recoverPassword/:token', [
  middlAuth.ensureNotAuthenticated,
  param('token').not().isEmpty().trim(),
  body('pass1').not().isEmpty().isLength({max: 128}),
  body('pass2').not().isEmpty().isLength({max: 128})
], Auth.recoverPasswordPost);

projects.get('/profile', middlAuth.ensureAuthenticated, Profile.profile);
projects.post('/saveProject/:id', [middlAuth.ensureAuthenticated, param('id').not().isEmpty().trim().isMongoId()], Profile.saveProject);
projects.post('/unsaveProject/:id', [middlAuth.ensureAuthenticated, param('id').not().isEmpty().trim().isMongoId()], Profile.unsaveProject);
projects.get('/activity', middlAuth.ensureAuthenticated, Profile.getActivity);
projects.get('/getUserPoints/', middlAuth.ensureAuthenticated, Profile.getUserPoints);
projects.get('/getUserMemberDate', middlAuth.ensureAuthenticated, Profile.getUserMemberDate);
projects.post('/updateProfile', [
  middlAuth.ensureAuthenticated,
  body('name').not().isEmpty().trim().isLength({max: 50}).escape(),
  body('surname').not().isEmpty().isLength({max: 50}).trim().escape(),
  body('desc').not().isEmpty().isLength({max: 160}).trim().escape()
], Profile.updateProfile);
projects.post('/updatePassword', [
  middlAuth.ensureAuthenticated,
  body('actualPass').not().isEmpty().isLength({max: 128}),
  body('newPass').not().isEmpty().isLength({max: 128}),
  body('newPassCheck').not().isEmpty().isLength({max: 128}),
], Profile.updatePassword);
projects.get('/verifyEmail/:token', [param('token').not().isEmpty().trim()], Profile.verifyEmail);
//projects.get('/getRandomProfilePic',Profile.getRandomProfilePic);
projects.get('/getProfilePic',middlAuth.ensureAuthenticated,Profile.getProfilePic);
projects.get('/getProfilePicFromUser/:usr',[param('usr').not().isEmpty().trim()],Profile.getProfilePicFromUser);
projects.get('/userProfile/:username',[param('username').not().isEmpty().trim()],Profile.getUserProfile);
projects.post('/updateEmail',[
  middlAuth.ensureAuthenticated,
  body('password').not().isEmpty().isLength({max: 128}),
  body('email').not().isEmpty().trim().isEmail().normalizeEmail().isLength({max: 100}),
  body('newEmail').not().isEmpty().trim().isEmail().normalizeEmail().isLength({max: 100}),
],Profile.updateEmail);
projects.get('/verifyUpdateEmail/:token',[param('token').not().isEmpty().trim()], Profile.verifyUpdateEmail);
//projects.get('/test',Profile.test);

projects.get('*', Menu.notFound);


app.use(projects);

mongoose.connect('mongodb://localhost/project', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, function(err, res) {
  if(err) {
    console.log('ERROR: connecting to Database. ' + err);
  }
  app.listen(8080, function() {
    console.log("Node server running on http://localhost:8080");
  });
});
