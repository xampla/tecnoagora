var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var commentSchema = new Schema({
  project:    { type: Schema.Types.ObjectId, ref: 'Project' },
  body:       { type: String },
  creator:    { type: String },
  points:     { type: Number },
  date:       { type: Date }
});

module.exports = mongoose.model('Comment', commentSchema);
