var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var contactSchema = new Schema({
  email:      { type: String },
  name:       { type: String },
  surname:    { type: String },
  desc:       { type: String },
  date:       { type: Date }
});

module.exports = mongoose.model('Contact', contactSchema);
