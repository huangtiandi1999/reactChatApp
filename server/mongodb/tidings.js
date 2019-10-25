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
  receiveObj: Schema.Types.Mixed,
  /**
   * 严格来说，这是无奈的做法，消息队列应该与聊天记录同时循环渲染
   * 这样我们每次发送消息都不需要单独操作数据库来存储这一条记录，只需要展示最后一条消息即可
   */
  lastMessage: String, 

});

const Tidings = mongoose.model('Tidings', tidingsSchema);

// 将model对象导出, 我们可以直接实例化model为一个文档对象
module.exports = Tidings;
