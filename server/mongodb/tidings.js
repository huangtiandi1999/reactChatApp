const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/xuanshao');

const Schema = mongoose.Schema;

const tidingsSchema = new Schema({
  sendId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  receiveId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  receiveObj: Schema.Types.Mixed
});

const Tidings = mongoose.model('Tidings', tidingsSchema);

// 将model对象导出, 我们可以直接实例化model为一个文档对象
module.exports = Tidings;
