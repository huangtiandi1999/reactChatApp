import { message } from 'antd';

import { commonService } from '../utils/request';
import { setItem } from '../utils/storageUtil';
import socket from '../utils/socket';
// action creator

export const effects = {
  syncAddCounter: (params) => ({
    type: 'saveReducer',
    payload: {
      counter: params.counter
    },
  }),

  // 搜索
  fetchUserList: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, data, errMsg } = res;

        if (!success) {
          message.error(errMsg);
          return false;
        }

        dispatch({
          type: 'saveReducer',
          payload: {
            userlist: data
          }
        });

        return true;
      })
    )
  ),

  // 请求用户信息
  fetchUserInfo: (params) => (
    (dispatch) => (
      commonService(params).then((res) => {
        const { success, data, errMsg } = res;

        if (!success) {
          message.error(errMsg);
          return false;
        }

        setItem('user', data);
        socket.emit('ADD_USER', data);

        dispatch({
          type: 'saveReducer',
          payload: {
            isLogin: true,
          },
        });

        return true;
      })
    )
  ),

  // 消息记录
  fetchChatRecord: (params) => (
    () => (
      commonService(params).then(res => {
        const { data = [], success, errMsg } = res;

        if (!success) {
          message.error(errMsg);
        }

        return {
          success,
          chatRecord: data,
        }
      })
    )
  ),

  // 更新消息队列的最新消息
  syncUpdateNewMessage: (params) => (
    (dispatch) => {
      console.log(params);
      dispatch({
        type: 'updateNewMsgReducer',
        payload: {
          ...params
        }
      });
    }
  ),

  // 退出登录
  fetchSignout: (params) => (
    () => commonService(params).then(res => {
        const { success, msg } = res

        if (!success) {
          message.error(msg);
          return false;
        }
        return true;
    })
  ),

  // 注册
  registerAccount: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, errMsg } = res;

        if (!success) {
          message.error(errMsg, 2);
          return false;
        }

        dispatch({
          type: 'saveReducer',
          payload: {
            register: true
          }
        })
        return true;
      })
    )
  ),

  // 校验Account
  confirmAccount: (params) => (
    () => (
      commonService(params).then(res => {
        const { success, infoMessage, errMsg } = res;

        if (!success) {
          message.error(errMsg);
          return {
            success: false
          }
        }

        if (infoMessage) {
          return {
            success: false,
            showErr: true
          }
        }

        return {
          success: true
        }
      })
    )
  ),

  // 请求添加好友
  requestFriend: (params) => (
    () => (
      commonService(params).then(res => {
        const { success, errMsg } = res;

        if (!success) {
          message.error(errMsg, 2);
          return false;
        }

        return true;
      })
    )
  ),

  // 请求通知记录
  fetchNotifyRecord: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, data, errMsg } = res;

        if (!success) {
          message.error(errMsg, 2);
          return false;
        }

        dispatch({
          type: 'saveReducer',
          payload: {
            notifyRecord: data,
          }
        });
        return true;
      })
    )
  ),

  // 更改props状态驱动新view
  changeNotifyStatus: (params) => (
    (dispatch) => {
      commonService(params).then(res => {
        const { success, errMsg } = res;

        if (!success) {
          message.error(errMsg);
          return;
        }

        dispatch({
          type: 'changeStatusReducer',
          payload: {
            _id: params._id,
            status: params.status
          }
        });
      })
    }
  ),

  // 好友列表
  fetchFriendList: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, errMsg, data } = res;

        if (!success) {
          message.error(errMsg);
          return false;
        }

        dispatch({
          type: 'saveReducer',
          payload: {
            friendList: data
          }
        });
        return true;
      })
    )
  ),

  // 该账户的消息队列
  fetchTidingsList: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, data, errMsg } = res;

        if (!success) {
          message.error(errMsg);
          return false;
        }

        dispatch({
          type: 'saveReducer',
          payload: {
            tidingsList: data,
          }
        });
        return true;
      })
    )
  ),

  // 向某位用户发送消息 --加入消息队列
  changeTidingsList: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, errMsg } = res;

        if (!success) {
          message.error(errMsg, 2);
          return false;
        }

        dispatch({
          type: 'changeTidingsReducer',
          payload: {
            ...params
          }
        });
        return true;
      })
    )
  ),

  // 朋友圈动态
  fetchMomentsList: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, errMsg, data } = res;

        if (!success) {
          message.error(errMsg);
          return false;
        }

        dispatch({
          type: 'saveReducer',
          payload: {
            momentsList: data
          }
        });
        return true;
      })
    )
  ),

  // 点赞或取消点赞
  praisedComments: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, errMsg } = res;

        if (!success) {
          message.error(errMsg);
          return false;
        }

        dispatch({
          type: 'changePraisedListReducer',
          payload: {
            ...params
          }
        });
        return true;
      })
    )
  ),

  // 评论回复
  doComment: (params) => (
    (dispatch) => (
      commonService(params).then(res => {
        const { success, errMsg } = res;

        if (!success) {
          message.error(errMsg);
          return false;
        }

        dispatch({
          type: 'appendToCommentsReducer',
          payload: {
            ...params
          }
        });
        return true;
      }) 
    )
  )

}