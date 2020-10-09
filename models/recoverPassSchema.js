var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var recoverPassSchema = new Schema({
  token:      { type: String },
  email:      { type: String },
  expire:     { type: Date }
});

module.exports = mongoose.model('Recover', recoverPassSchema);
