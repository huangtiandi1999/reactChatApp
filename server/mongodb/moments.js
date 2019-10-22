const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/xuanshao');

const Schema = mongoose.Schema;

// 评论
const commentSchema = new Schema({
  comContent: {
    type: String,
    required: true
  },
  Username: {
    type: String,
    required: true
  },
  targetUser: String
});

const momentsSchema = new Schema({
  content: String,
  imgPath: Array,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  praised: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentChild: [commentSchema],
  createTime: Number,
});

const Moments = mongoose.model('Moments', momentsSchema);

// 将model对象导出, 我们可以直接实例化model为一个文档对象
module.exports = Moments;
