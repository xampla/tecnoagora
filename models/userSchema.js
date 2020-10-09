var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var userSchema = new Schema({
  name:      { type: String },
  surname:   { type: String },
  username:  { type: String },
  email:     { type: String },
  emailVerified: { type:Boolean },
  pass:      { type: String },
  extLink:   { type: String },
  desc:      { type: String },
  profile_pic: { type: String },
  addedProj: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  ratedProj: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  savedProj: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  comments:  [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  spentPoints: { type: Number },
  date:      { type: Date }
});

module.exports = mongoose.model('User', userSchema);
