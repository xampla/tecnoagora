var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var projectSchema = new Schema({
  title:      { type: String },
  descSmall:  { type: String },
  descBig:    { type: String },
  link:       { type: String },
  linkWeb:    { type: String },
  creator:    { type: String },
  numRates:   { type: Number },
  numSaves:   { type: Number },
  comments:   [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  tags:       [String],
  date:       { type: Date },
  lastUpdate: { type: Date }
});

module.exports = mongoose.model('Project', projectSchema);
