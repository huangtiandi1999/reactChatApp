const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/xuanshao');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  Username: String,
  Sex: String,
  Age: Number,
  Email: String,
  Account: {
    type: String,
    required: true,
  },
  Password: {
    type: String,
    required: true,
  },
  createTime: Number,
  headImage: String
});
userSchema.virtual('userId').get(() => this._id);

const User = mongoose.model('User', userSchema);

// 将model对象导出, 我们可以直接实例化model为一个文档对象
module.exports = User;
