var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var changeEmailSchema = new Schema({
  token:      { type: String },
  user:       { type: String},
  newEmail:   { type: String },
  expire:     { type: Date }
});

module.exports = mongoose.model('ChangeEmail', changeEmailSchema);
