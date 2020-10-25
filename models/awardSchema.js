var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var awardSchema = new Schema({
  creator: { type: String },
  award:   { type: String },
  date:    { type: Date },
  project: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
});

module.exports = mongoose.model('Award', awardSchema);
