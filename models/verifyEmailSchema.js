var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var verifyEmailSchema = new Schema({
  token:      { type: String },
  email:      { type: String },
  expire:     { type: Date }
});

module.exports = mongoose.model('Verify', verifyEmailSchema);
