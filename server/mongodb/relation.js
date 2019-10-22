const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/xuanshao');

const Schema = mongoose.Schema;

const relationSchema = new Schema({
  Auid: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  Ruid: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createTime: Number,
  remark: String, // 备注
});

const Relation = mongoose.model('Relation', relationSchema);

module.exports = Relation;