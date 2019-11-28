
const initialState = {
  data: [],
  isLogin: false,
  userlist: [], // 搜索用户列表
  register: false,

  notifyRecord: [], // 通知记录
  friendList: [], // 好友列表
  tidingsList: [], // 消息队列
  momentsList: [], // 朋友圈动态集合
}

function removeItem(arr, key) {
  let target = arr.find(el => el._id === key);
  let index = arr.indexOf(target);

  arr.splice(index, 1);
  return arr;
}

export const reducers = {
  saveReducer: (state, { payload }) => ({
    ...state,
    ...payload,
  }),

  // 更改通知的状态 -- 同意或拒绝
  changeStatusReducer: (state, { payload }) => {
    const newRecord = state.notifyRecord.map(item => {
      if (item._id === payload._id) {
        item.status = payload.status;
        return item;
      }

      return item;
    });

    return {
      ...state,
      notifyRecord: newRecord
    };
  },

  // 单击发消息时更改消息队列
  changeTidingsReducer: (state, { payload }) => ({
    ...state,
    tidingsList: [{...payload, receiveId: {headImage: payload.receiveObj.headImage}}, ...state.tidingsList]
  }),

  // 给对方发消息更改对方的消息队列
  createNewTidings: (state, { payload }) => ({
    ...state,
    tidingsList: [payload, ...state.tidingsList]
  }),

  // 更新消息队列的最新消息
  updateNewMsgReducer: (state, { payload }) => {
    let newData = state.tidingsList.map(el => {
      if (el.receiveObj._id == payload.currentTidings) {
        return {...el, lastMessage: payload.message}
      }

      return el;
    });

    return {
      ...state,
      tidingsList: newData,
    }
  },

  // 修改点赞列表
  changePraisedListReducer: (state, { payload }) => {
    const { userId, Comid, flag, Username } = payload;

    const newData = state.momentsList.map(el => {
      if (Comid === el._id) {
        el.praised = flag === 1 ? [...el.praised, {_id: userId, Username}] : removeItem(el.praised, userId);
        return el
      }

      return el;
    });

    return {
      ...state,
      momentsList: newData
    };
  },

  // 朋友圈评论列表添加
  appendToCommentsReducer: (state, { payload }) => {
    const obj = { Username: payload.Username, comContent: payload.comContent };
    const newData = state.momentsList.map(el => {
      if (el._id === payload.momentsId) {
        el.commentChild = [...el.commentChild, obj];
        return el;
      }

      return el;
    });

    return {
      ...state,
      momentsList: newData
    };
  },

  // 删除好友
  removeFriendReducer: (state, { payload }) => {
    const { _id } = payload;

    return {
      ...state,
      friendList: state.friendList.filter(el => el._id != _id)
    }
  },

  // 删除某个消息队列
  removeTidingsReducer: (state, { payload }) => {
    const { _id } = payload;

    return {
      ...state,
      tidingsList: state.tidingsList.filter(e => e._id != _id)
    }
  }
}

export const combineReducers = (state = initialState, action) => {
  const handler = reducers[action.type];

  return handler ? handler(state, action) : state;
}

