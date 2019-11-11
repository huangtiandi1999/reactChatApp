const express = require('express');
const router = express.Router();
const formidable = require('formidable');
const path = require('path');

const {
  reNameImg,
  formatFriendlistToIdArray,
  uniqueArray,
  formatUserList
} = require('./serverUtil');
const User = require('./mongodb/user');
const Message = require('./mongodb/message');
const Notify = require('./mongodb/notify');
const Relation = require('./mongodb/relation');
const Tidings = require('./mongodb/tidings');
const Moments = require('./mongodb/moments');

router.post('/login', (req, res) => {
  const { Account, Password } = req.body;

  User.findOne({Account, Password}, (err, result) => {
    if (err) {
      return res.send('查询错误');
    }

    if (result === null) {
      return res.send({
        success: false,
        errMsg: '帐号或密码错误',
      }); 
    } 
    req.session.user = result;
    res.send({
      data: result,
      success: true,
    });
  })
})

router.post('/userlist', (req, res) => {
  const { keyword, userId, Account } = req.body;
  const reg = new RegExp(keyword, 'i');

  Relation.find({$or: [
    { 'Auid': userId },
    { 'Ruid': userId } 
  ]}, (err, result = []) => {
    if (!err) {
      User.find({$or: [
        { Username: {$regex: reg} },
        { Account: {$regex: reg, $ne: Account} },
      ]})
      .lean()
      .select('-Password')
      .exec((err, userList) => {
        if (err) {
          res.status(500).send({
            errMsg: '查询错误',
            success: false
          });
        } else {
          res.send({
            data: formatUserList(userList, result, userId),
            success: true,
            errMsg: ''
          });
        }
      });
    }
  })
})

router.post('/signout', (req, res) => {
  let success, msg;

  if (req.session.user) {
    req.session.user = null;
    success = true;
    msg = '退出登录成功';
  } else {
    success = false;
    msg = '您并未登录,指令错误';
  }

  res.send({
    success,
    msg,
  });
})

router.post('/registerAccount', (req, res) => {
  new User({...req.body, headImage: '/defaultHeadImage.jpeg', createTime: +Date.now()}).save(err => {
    console.log(err)
    if (err) {
      return res.send({
        success: false,
        errMsg: '注册失败',
      });
    }
    res.send({
      success: true,
    })
  })
})

router.post('/confirmAccount', (req, res) => {
  const { Account } = req.body;

  User.findOne({Account}, (err, result) => {
    if (err) {
      return res.send({success: false, errMsg: '校验错误'});
    }

    if (result) {
      res.send({
        success: true,
        infoMessage: 'repet Account'
      });
    } else {
      res.send({
        success: true
      });
    }
  })
})

// 在前端如果使用的content-type是普通文本  属于简单请求 不会触发cors预检  所以可以直接返回
router.post('/sendMessage', (req, res) => {
  // 非cors模块的 跨域配置  将A-C-A-O设置为请求origin 同时如果有自定义的http头部  要将它加入到Allow-Headers里面
  // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  // res.header('Access-Control-Allow-Headers','sadsad, content-type');

  res.header('Content-Type', 'application/json');
  new Message({...req.body, createTime: +Date.now()}).save((err) => {
    if (err) {
      res.send({
        success: false,
        errMsg: '请求错误',
      });
    } else {
      res.send({
        success: true,
        info: '发送成功',
      });
    }
  });
})

router.post('/chatRecord', (req, res) => { 
  const { Account, receiveAccount } = req.body;

  Message.find({$or: [
    { Account, receiveAccount},
    { Account: receiveAccount, receiveAccount: Account}
  ]}).populate({
    path: 'sendId',
    select: 'headImage'
  })
  .limit(50)
  .sort({'_id': -1})
  .exec((err, result) => {
    if (err) {
      res.send(500, {
        errMsg: '服务器错误',
        success: false
      });
    } else {
      res.send({
        data: result.reverse(),
        errMsg: '',
        success: true
      });
    }
  })
})

// 请求添加好友  表示创建一条notify
router.post('/requestFriend', (req, res) => {
  new Notify({
    ...req.body,
    createTime: +Date.now()
  }).save(err => {
    if (err) {
      return res.send({
        success: false,
        errMsg: '请求添加好友失败'
      });
    }

    res.send({
      success: true,
    })
  })
})

// 以接受者的_id为参数
router.post('/notifyRecord', (req, res) => {
  const { Ruid } = req.body;
  Notify.find({
    Ruid,
  })
  .populate({
    path: 'Auid' // 路径为主动添加方的userinfo 记得给Auid添加ref
  })
  .sort({'_id': -1})
  .exec((err, result) => {
    if (err) {
      res.send({
        success: false,
        errMsg: '服务器错误',
      });
    } else {
      res.send({
        success: true,
        errMsg: '',
        data: uniqueArray(result, 'Auid', '_id'),
      });
    }
  });
})

// 同意或拒绝添加好友  如果status为1则在friends集合中插入一条记录表示好友关系 否则修改通知状态为拒绝
router.post('/dealWithRequest', (req, res) => {
  const { _id, status, Ruid, Auid } = req.body;

  Notify.findByIdAndUpdate(_id, { status }, (err, _) => {
    if (err) {
      res.send(500, { success: false, errMsg: '服务器错误'});
    } else {
      if (status === 1) {
        new Relation({
          Auid,
          Ruid,
          createTime: +Date.now()
        })
        .save(err => {
          if (err) {
            res.send(500, {
              success: false,
              errMsg: '服务器错误，添加好友失败'
            });
          } else {
            res.send({
              success: true
            });
          }
        });
      } else {
        res.send({
          success: true,
        })
      }
    }
  })
})

router.post('/queryFriendsById', (req, res) => {
  const { userId } = req.body;

  Relation.find({
    $or: [
      { 'Auid': userId },
      { 'Ruid': userId }
    ]
  })
  .populate({
    path: 'Auid',
    select: '-Password'
  })
  .populate({
    path: 'Ruid',
    select: '-Password'
  })
  .exec((err, result) => {
    if (err) {
      res.status(500).send({
        success: false,
        errMsg: '服务器错误'
      });
    } else {
      res.send({
        success: true,
        data: result
      });
    }
  })
})

router.post('/queryTidingsList', (req, res) => {
  Tidings.find({
    ...req.body
  })
  .populate('receiveId', 'headImage')
  .sort({'_id': -1})
  .exec((err, result) => {
    if (err) {
      res.send(500, {
        success: false,
        errMsg: '服务器错误'
      });
    } else {
      res.send({
        success: true,
        data: result
      })
    }
  })
})

router.post('/joinToTidingsList', (req, res) => {
  new Tidings({
    ...req.body
  })
  .save(err => {
    if (err) {
      res.send(500, {
        success: false,
        errMsg: '服务器错误'
      });
    } else {
      res.send({
        success: true
      })
    }
  })
})

router.post('/queryMomentsList', (req, res) => {
  // 逻辑是先拿到该用户的所有好友
  Relation.find({$or: [
    { 'Auid': req.body.userId },
    { 'Ruid': req.body.userId }
  ]}, (err, result) => {
    if (err) {
      res.status(500).send({
        success: false,
        errMsg: '获取好友列表失败'
      });
    } else {
      let forRes = [...formatFriendlistToIdArray(result, req.body.userId), req.body.userId];
      Moments.find({
        userId: {$in: forRes}
      })
      .populate('userId', '-password')
      .populate({
        path: 'praised',
        match: {_id: {$in: forRes}}, // 该条朋友圈的点赞人 必须互为好友才能看到
        select: 'Username'
      })
      .sort({'_id': -1})
      .limit(15)
      .exec((err, result) => {
        if (err) {
          res.status(500).send({
            success: false,
            errMsg: '获取朋友圈动态失败'
          });
        } else {
          res.send({
            success: true,
            data: result
          });
        }
      });
    }
  })
})

// 发表朋友圈
router.post('/publishComments', async (req, res) => {
  const form = new formidable.IncomingForm();
  form.multiples = true;
  form.maxFileSize = 5 * 1024 * 1024;
  form.uploadDir = path.join(__dirname, './uploadImg');

  let result = await new Promise((resolve) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        resolve({err});
      }

      resolve({
        imgPath: files.img ? reNameImg(files.img) : [],
        content: fields.content,
        userId: fields.userId
      });
    })
  });

  if (result.err) {
    res.status(500).send({
      success: false
    })
    return;
  }

  let obj = {...result, createTime: +Date.now(), praised: []};

  new Moments(obj).save(err => {
    if (err) {
      res.status(500).send({
        success: false,
        errMsg: '发朋友圈失败'
      });
    } else {
      res.send({
        success: true
      });
    }
  })
})

router.post('/praisedComments', (req, res) => {
  const { userId, flag, Comid } = req.body;

  // 点赞
  if (flag === 1) {
    Moments.update({'_id': Comid}, {
      $addToSet: {
        praised: userId
      }
    }, (err) => {
      if (err) {
        res.status(500).send({
          success: false,
          errMsg: '服务器错误'
        });
      } else {
        res.send({
          success: true
        });
      }
    });
  } else {
    Moments.update({'_id': Comid}, {
      $pull: {
        praised: userId
      }
    }, (err) => {
      if (err) {
        res.status(500).send({
          success: false,
          errMsg: '服务器错误'
        });
      } else {
        res.send({
          success: true
        });
      }
    });
  }
})

// 评论或者回复
router.post('/doComment', (req, res) => {
  const { momentsId, comContent, commentUserId, Username } = req.body;

  Moments.findById(momentsId, (err, doc) => {
    if (err) {
      res.status(500).send({
        success: false,
        errMsg: '服务器错误'
      });
      return;
    }

    doc.commentChild.push({
      comContent,
      commentUserId,
      Username
    })

    doc.save();

    res.send({
      success: true,
    })
  })
})

router.post('/removeFriendItem', (req, res) => {
  const { _id } = req.body;

  Relation.remove({_id}, err => {
    if (err) {
      res.status(500).send({
        success: false,
        errMsg: '删除好友失败'
      });
    } else {
      res.send({
        success: true
      });
    }
  });
})


module.exports = router;