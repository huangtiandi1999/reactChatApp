const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/xuanshao');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  message: {
    type: String,
    required: true,
  },
  Username: String,
  Account: {
    type: String,
    required: true,
  },
  sendId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  createTime: Number,
  receiveAccount: String,
  receiveName: String,
  timeStemp: Boolean,
  status: Number, // 消息状态：0表示未读 1表示以读
});

const Message = mongoose.model('Messages', messageSchema);

// 将model对象导出, 我们可以直接实例化model为一个文档对象
module.exports = Message;
