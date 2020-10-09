var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var activitySchema = new Schema({
  creator:      { type: String },
  actType:      { type: String },
  referenceId:  { type: Schema.Types.ObjectId },
  body:         { type: String },
  date:         { type: Date }
});

module.exports = mongoose.model('Activity', activitySchema);
