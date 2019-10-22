const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);
mongoose.connect('mongodb://localhost/xuanshao');

const Schema = mongoose.Schema;

const notifySchema = new Schema({
  Auid: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  Ruid: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createTime: Number,
  status: Number, // 0:未确定 1:已同意 2:已拒绝
  requestMessage: String,
});

const Notify = mongoose.model('notify', notifySchema);

// 将model对象导出, 我们可以直接实例化model为一个文档对象
module.exports = Notify;
