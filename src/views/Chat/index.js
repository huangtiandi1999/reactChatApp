import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import {
  Tag,
  Input,
  Avatar,
  message,
  Icon,
  Badge,
  Collapse,
  Drawer,
  Upload
} from 'antd';

import { effects } from '../../model/action';
import { getItem } from '../../utils/storageUtil';
import { defaultImage, platformApiPrefix } from '../../../defaultSetting';
import socket from '../../utils/socket';
import { debounce } from '../../utils/request';
import formatTime, { formatNotifyTime, formatFriendList, confirmKeyInObjArray } from '../../utils/format';
import mapListObj from './map';

import styles from './index.less';

class Chat extends Component {
  state = {
    barrageList: [],
    showDrawer: false,
    targetObj: {
      receiveName: '',
      receiveAccount: '',
    },
    fileList: [], // 朋友圈图片
    spin: false, // 朋友圈图标旋转flag
    spreadComment: -1, // 展开的评论

    selectMenu: [
      { type: 'message', value: 1},
      { type: 'team', value: 2},
      { type: 'notification', value: 3}
    ],

    currentTidings: -1, // 当前选择的消息窗口
    currentFriend: -1, // 当前选择的好友索引
    currentFriendObj: null,
    currentSelectBox: 1, // 当前选择的menu，默认是tidings窗口

    notifyFlag: false, // 请求通知记录的flag，用户选择该窗口只请求一次
  } 

  componentDidUpdate() {
    this.scrollToBottom();
  }

  componentDidMount() {
    this.monitorSocket();

    // 网页刷新导致后台socket实例变化 这时候如果你不重新覆盖socket将导致对方无法接收到消息
    if (getItem('user')) {
      socket.emit('ADD_USER', getItem('user'));
      this.queryFriendList();
      this.queryTidingsList();
      this.queryMomentsList();
    }
  }

  // 好友列表
  queryFriendList = () => {
    const { fetchFriendList } = this.props;

    fetchFriendList({
      serviceUrl: 'queryFriendsById',
      userId: getItem('user')._id,
    }); 
  }

  // 消息队列
  queryTidingsList = () => {
    const { fetchTidingsList } = this.props;

    fetchTidingsList({
      serviceUrl: 'queryTidingsList',
      sendId: getItem('user')._id
    });
  }

  // 朋友圈动态
  queryMomentsList = () => {
    const { fetchMomentsList } = this.props;

    return fetchMomentsList({
      serviceUrl: 'queryMomentsList',
      userId: getItem('user')._id,
    });
  }
  
  monitorSocket = () => {
    const { addNewTidings } = this.props;
    socket.on('message', data => {
      if (data.sendId === this.state.currentTidings) {
        /* 
          如果说接收方的消息队列当前选择的是 给他发送消息的好友 则添加记录
          否则造成的后果是 A给B发送消息 如果B没有选择与A聊天的窗口 还是会接收到这条消息并错误的展示在B与其他人的聊天窗口中
          由于当前的方案是 每次单击窗口我们都请求记录
          后续的优化计划是：对于同一个消息窗口，我们请求聊天记录只放在第一次点击
        */
        this.setState({
          barrageList: [...this.state.barrageList, data]
        });
      }

      this.props.syncUpdateNewMessage({
        currentTidings: data.sendId,
        message: data.message
      })
    });

    socket.on('addNewTiding', t => {
      addNewTidings(t);
    })

    socket.on('warnning', data => {
        message.warning(data, 2);
    });

    socket.on('handleError', data => {
      message.error(data, 2);
    });

    socket.on('notifyReq', _ => {
      this.setState({
        notifyFlag: false
      }, () => {
        this.queryNotifyRecord();
      })
    })
  }

  renderChat = () => {
    const { barrageList, targetObj: { receiveName } } = this.state;

    return (
      <div className={styles.chatWrap}>
        <header className={styles.chatHeader}>
          {receiveName}
        </header>

        <div className={styles.chatBody}>
          { barrageList.length ? 
            this.renderMessageList(barrageList)
            : null
          }
        </div>
        <div className={styles.fixBottom}>
            <Input.TextArea
             id='myInput'
             placeholder="Enter发送消息,Shift+Enter换行"
             onKeyDown={(e) => this.handleKeyDown(e)}
             rows={3}/>
          </div>
      </div>
    );
  }

  renderMessageList = list => {
    let userinfo = getItem('user') || {};
    const isLeft = !userinfo.Account;
 
    return (
      <ul className={`${styles.messageList} lists`}>
        { list.length ? 
          list.map((el, index) => {
            return (
              <Fragment key={`${el.message}${index}`}>
                { el.timeStemp ? (
                  <li className={styles.timeStemp}>
                    <span>{formatTime(el.createTime)}</span>
                  </li>
                ) : null}
                {/* 没登录或者是当前帐号发言 */}
                <li
                className={(isLeft || (el.Account ===  userinfo.Account)) ? styles.leftMessage : styles.rightMessage}
                >
                  <Avatar
                  size="large"
                  shape="square"
                  src={userinfo.Account ? (el.headImage ? el.headImage : el.sendId.headImage) : defaultImage}/>
                  <span className={styles.chatText}>{el.message}</span>
                </li>
              </Fragment>
            )
          }) : null}
      </ul>
    );
  }

  // 发送消息后定位滚动条位置
  scrollToBottom = () => {
    const list = document.querySelector('.lists');

    if (list) {
      list.scrollTop = list.scrollHeight - list.clientHeight;
    }
  }

  handleKeyDown = e => {
    const { keyCode, shiftKey, target: { value } } = e;
    const input = document.querySelector('#myInput');
    
    if (shiftKey && keyCode === 13) {
      // 开启换行默认行为
    } else if (keyCode === 13) {
      e.preventDefault();
      if (value.replace(/^[\s\n\r]$/g) === '') {
        return message.warning('请输入有效消息');
      }
      input.value = '';
      this.scrollToBottom();
      this.postMsg(value);
    }
    
    return true;
  }
  
  postMsg = msg => {
    const { Account = '', _id, headImage, Username } = getItem('user') || {};
    const { barrageList, currentTidings } = this.state;
    const len = barrageList.length;
    let timeStemp;
    if (!len) {
      timeStemp = true;
    } else {
      // 和上一条消息间隔4分钟以上 才会显示当前消息的时间格式    两分钟后由刚刚转变成时间
      timeStemp = (+Date.now() - barrageList[len - 1].createTime) > (4 * 60 * 1000);
    }

    const payload = {
      Username,
      Account,
      sendId: _id,
      message: msg,
      createTime: +Date.now(),
      timeStemp,
      headImage,
      currentTidings,
      ...this.state.targetObj,
    }

    if (Account && (currentTidings !== -1)) {
      socket.emit('sendTo', payload);
      this.props.syncUpdateNewMessage({
        currentTidings,
        message: msg
      });
      this.setState({
        barrageList: [...barrageList, payload],
      });
    } else {
      this.setState({
        barrageList: [...barrageList, payload]
      });
      message.info('您未登录，发送的消息不会存储', 1.5);
    }
  }

  // 消息队列
  renderTidings = () => {
    const { tidingsList } = this.props;

    return (
      <div className={styles.tidingsWrap}>
        <header className={styles.friendHeader}>
          <Input placeholder="搜索" size="small" prefix={<Icon type="search"/>} style={{color: 'rgba(0,0,0,.25)'}}/>
        </header>

        {tidingsList.length ? (
          <ul className={styles.tidingsList}>
            {tidingsList.map(el => (
              <li
              onClick={() => this.handleTidingsItemClick(el.receiveObj)}
              className={this.state.currentTidings === el.receiveObj._id ? `${styles.tidingsListItem} ${styles.active}` : styles.tidingsListItem}
              key={el.receiveObj._id}
             >
               <Badge count={1}>
                 <Avatar shape="square" size="large" src={el.receiveId.headImage}/>
               </Badge>
               <div className={styles.flrightWrap}>
                 <p className={styles.userName}>{el.receiveObj.Username}</p>
                 <span>{el.lastMessage}</span>
               </div>
             </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }

  handleTidingsItemClick = el => {
    const { Account, Username, _id } = el;
    const { fetchChatRecord } = this.props;

    this.setState({
      currentTidings: _id,
      targetObj: {
        receiveAccount: Account,
        receiveName: Username,
      }
    });

    fetchChatRecord({
      serviceUrl: 'chatRecord',
      Account: getItem('user').Account,
      receiveAccount: Account,
    })
    .then(res => {
      if (res.success) {
        this.setState({
          barrageList: res.chatRecord
        });
      }
    })
  }

  queryNotifyRecord = () => {
    const userinfo = getItem('user');
    const { fetchNotifyRecord } = this.props;

    if (userinfo && !this.state.notifyFlag) {
      fetchNotifyRecord({
        serviceUrl: 'notifyRecord',
        Ruid: userinfo._id,
      })
      .then(_ => {
        this.setState({
          currentSelectBox: 3,
          notifyFlag: true,
        });
      })
    } else {
      this.setState({
        currentSelectBox: 3,
      })
    }
  }

  renderMenu = () => {
    const { selectMenu, currentSelectBox = 1 } = this.state;
    const style = {
      fontSize: 32,
      marginBottom: 25,
      cursor: 'default',
    }

    return(
      <div className={styles.menuWrap}>
        {selectMenu.map((el, index) => (
          <Icon key={index} type={el.type} 
          onClick={
            el.value !== 3 
            ? () => this.setState({currentSelectBox: el.value})
            : this.queryNotifyRecord
          }
          style={{
            ...style,
            color: currentSelectBox === el.value ? '#55b737' : '#d5d5d5',
          }}
          />
        ))}
        <svg style={{zIndex: currentSelectBox === 4 ? 999 : 0}} onClick={() => this.setState({currentSelectBox: 4})} t="1571193011595" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1181" width="120" height="130"><path d="M652.189 114.635s-55.86-22.614-140.234-22.614c-84.37 0-140.23 25.903-140.23 25.903l280.549 285.449-0.085-288.738z" fill="#FB5453" p-id="1182"></path><path d="M811.202 217.796c-61.928-58.727-121.8-79.649-121.8-79.649l-2.06 392.072 210.411-199.332c0 0.085-24.535-54.364-86.55-113.09z" fill="#6468F1" p-id="1183"></path><path d="M906.498 368.778L617.205 645.535h292.667s22.95-55.119 22.95-138.419c-0.087-83.215-26.324-138.338-26.324-138.338z" fill="#5283F0" p-id="1184"></path><path d="M696.62 887.697s56.813-22.842 118.033-80.602c61.223-57.757 83.1-113.488 83.1-113.488l-409.132-1.946L696.62 887.697z" fill="#00B2FE" p-id="1185"></path><path d="M371.806 911.213s55.864 22.61 140.234 22.61c84.455 0 140.234-25.902 140.234-25.902l-280.548-285.45 0.08 288.742z" fill="#66D020" p-id="1186"></path><path d="M224.484 808.047c61.934 58.732 121.806 79.65 121.806 79.65l2.057-392.072-210.411 199.33c0.084-0.08 24.619 54.365 86.548 113.092z" fill="#9AD122" p-id="1187"></path><path d="M114.134 368.778s-22.956 55.107-22.956 138.378c0 83.276 26.244 138.379 26.244 138.379l289.372-276.672h-292.66v-0.085z" fill="#FFC71A" p-id="1188"></path><path d="M339.07 138.147s-56.814 22.843-118.034 80.6c-61.222 57.758-83.1 113.494-83.1 113.494l409.132 1.942L339.07 138.147z" fill="#FF7612" p-id="1189"></path></svg>
      </div>
    )
  }

  // 通知记录
  renderNotifyBox = () => {
    const { notifyRecord } = this.props;

    return (
      <div className={styles.notifyWrap}>
        <h3 className={styles.notifyTitle}>系统通知消息<Tag color="#87d068">#我们将只展示您接收到的消息</Tag></h3>

        {notifyRecord.length 
        ? (
          <ul className={styles.notifyList}>
            {notifyRecord.map((el, index) => (
              <li key={`${index}${el.createTime}`} className={styles.notifyItem}>
                <p className={styles.timeFormat}>{formatNotifyTime(el.createTime)}</p>
                <div className={styles.innerBox}>
                  <div className={styles.boxTop}>
                    <Avatar shape="square" src={el.Auid.headImage}/>
                    <label><span>{el.Auid.Username}</span> &nbsp;请求添加好友</label>
                    {el.status !== 0
                    ? <label className={styles.status}>{el.status === 1 ? '已同意' : '已拒绝'}</label>
                    : (
                      <label className={styles.checkBtnGroup}>
                        <button onClick={() => this.dealWithRequest(1, el)}>同意</button>
                        <button onClick={() => this.dealWithRequest(2, el)}>拒绝</button>
                      </label>
                    )}
                  </div>
                  <p>附加消息:{el.requestMessage}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }

  dealWithRequest = (status, { _id, Ruid, Auid }) => {
    const { changeNotifyStatus } = this.props;

    changeNotifyStatus({
      serviceUrl: 'dealWithRequest',
      status,
      _id,
      Ruid,
      Auid: Auid._id
    })
  }

  // 好友列表
  renderFriendList = () => {
    const { friendList = [] } = this.props;

    return (
      <div className={styles.friendListWrap}>
        <Collapse bordered={false} defaultActiveKey="1">
          <Collapse.Panel header="新朋友"></Collapse.Panel>

          <Collapse.Panel header="联系人" key="1">
            {friendList.length ? (
              <ul className={styles.friendList}>
                { formatFriendList(friendList, getItem('user')._id).map((el, index) => (
                  <li 
                  onClick={() => this.setState({
                    currentFriend: el._id,
                    currentFriendObj: el
                  })}
                  key={`${el._id}${index}`} 
                  className={this.state.currentFriend === el._id ? `${styles.friendListItem} ${styles.active}` : styles.friendListItem}
                  >
                    <Avatar shape="square" src={el.headImage} />
                    <label className={styles.friendUserName}>{el.Username}</label>
                  </li>
                ))}
              </ul>
            ) : null }
          </Collapse.Panel>
        </Collapse>
      </div>
    )
  }

  renderFriendInfo = () => {
    const { currentFriendObj } = this.state;

    return (
      <div className={styles.infoWrap}>
        {currentFriendObj ? (
          <Fragment>
            <div className={styles.infoHeader}>
              <h3>{currentFriendObj.Username} <Icon style={{fontSize: 14, color: '#65b5ea', marginLeft: 6, verticalAlign: 'middle'}} type="man"/></h3>
              <Avatar src={currentFriendObj.headImage} shape="square" size={68}/>
            </div>
            <ul>
              {Object.keys(mapListObj).map((el, index) => (
                <li key={index}>
                  <label className={styles.labelHeader}>{mapListObj[el]}</label>
                  <span>{currentFriendObj[el]}</span>
                </li>
              ))}
            </ul>
            <button onClick={this.joinToTidingsList} className={styles.sendBtn}>发消息</button>
          </Fragment>
        ) : null}
      </div>
    )
  }

  refreshMoments = debounce(() => {
    this.queryMomentsList()
    .then(res => {
      if (res) {
        this.setState({spin: false})
      }
    });
  }, 1000, () => { this.setState({spin: true})})

  // 朋友圈
  renderMoments = () => {
    const { momentsList } = this.props;
    const { fileList, spin, spreadComment } = this.state;
    const { headImage, Username } = getItem('user') || {};
    const upLoadButton = (
      <div>
        <Icon type="plus"/>
        <div>Upload</div>
      </div>
    );
    const props = {
      beforeUpload: (file) => {
        const fileReader = new FileReader();

        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
          file.thumbUrl = fileReader.result;
          this.setState({
            fileList: [...this.state.fileList, file]
          });
        }
        return false;
      }
    }
    
    return (
      <div className={styles.momentsWrap}>
        <header className={styles.momentsHeader}>
          <h1>
            即刻开始，分享一点一滴
            <i onClick={() => this.setState({showDrawer: true})} title="发朋友圈" style={{marginLeft: 5, verticalAlign: -4, cursor: 'pointer'}}>
              <svg t="1571232057084" fill="#1afa29" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2533" width="24" height="24"><path d="M797.5 760.3L458.3 655.9l339.2-391.4-443.6 391.4L93 551.5l835-443.6-130.5 652.4zM458.3 916.9V734.2l104.4 52.2-104.4 130.5z m0 0" p-id="2534"></path></svg>
            </i>
          </h1>
          <div className={styles.ownWrap}>
            <span>{Username}</span>
            <Avatar size="large" shape="square" src={headImage} />
          </div>
        </header>
        
        <div className={styles.refreshWrap}>
          <svg onClick={this.refreshMoments} t="1571399816090" className={spin ? styles.momentsFresh : ''} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2779" width="20" height="20"><path d="M652.189 114.635s-55.86-22.614-140.234-22.614c-84.37 0-140.23 25.903-140.23 25.903l280.549 285.449-0.085-288.738z" fill="#FB5453" p-id="2780"></path><path d="M811.202 217.796c-61.928-58.727-121.8-79.649-121.8-79.649l-2.06 392.072 210.411-199.332c0 0.085-24.535-54.364-86.55-113.09z" fill="#6468F1" p-id="2781"></path><path d="M906.498 368.778L617.205 645.535h292.667s22.95-55.119 22.95-138.419c-0.087-83.215-26.324-138.338-26.324-138.338z" fill="#5283F0" p-id="2782"></path><path d="M696.62 887.697s56.813-22.842 118.033-80.602c61.223-57.757 83.1-113.488 83.1-113.488l-409.132-1.946L696.62 887.697z" fill="#00B2FE" p-id="2783"></path><path d="M371.806 911.213s55.864 22.61 140.234 22.61c84.455 0 140.234-25.902 140.234-25.902l-280.548-285.45 0.08 288.742z" fill="#66D020" p-id="2784"></path><path d="M224.484 808.047c61.934 58.732 121.806 79.65 121.806 79.65l2.057-392.072-210.411 199.33c0.084-0.08 24.619 54.365 86.548 113.092z" fill="#9AD122" p-id="2785"></path><path d="M114.134 368.778s-22.956 55.107-22.956 138.378c0 83.276 26.244 138.379 26.244 138.379l289.372-276.672h-292.66v-0.085z" fill="#FFC71A" p-id="2786"></path><path d="M339.07 138.147s-56.814 22.843-118.034 80.6c-61.222 57.758-83.1 113.494-83.1 113.494l409.132 1.942L339.07 138.147z" fill="#FF7612" p-id="2787"></path></svg>
          {/* <Icon spin={spin} onClick={this.refreshMoments} type="sync"/> */}
        </div>

        <Drawer
        closable={false}
        getContainer={false}
        title={
          <div className={styles.drawFlex}>
            <h2>即刻分享</h2>
            <button className={styles.publishBtn} onClick={this.publishMoments}>发表</button>
          </div>
        }
        width="275"
        onClose={() => this.setState({showDrawer: false})}
        style={{position: 'absolute'}}
        visible={this.state.showDrawer}
        >
          <textarea id="mInput" className={styles.momentsInput} placeholder="这一刻的想法..."></textarea>
          <Upload
          multiple={true}
          listType="picture-card"
          {...props}
          >
            {fileList.length >= 4 ? null : upLoadButton}
          </Upload>
        </Drawer>

        {momentsList.length ? (
          <ul className={styles.momentsList}>
            {momentsList.map(el => (
              <li key={el._id} className={styles.momentsListItem}>
                <Avatar shape="square" src={el.userId.headImage} size="large"/>
                <section>
                  <span className={styles.momentsUserName}>{el.userId.Username}</span>
                  <p>{el.content}</p>

                  {el.imgPath.length ? (
                    <div className={styles.imgWrap}>
                      {el.imgPath.map((path, index) => (
                        <img alt="图片" key={index} src={`${platformApiPrefix}/${path}`}/>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.momentsFooter}>
                    <span className={styles.mCT}>{formatTime(el.createTime, 2)}</span>
                    <div>
                      {!confirmKeyInObjArray(el.praised, '_id', getItem('user')._id)
                       ? <svg onClick={() => this.praisedMoments(el._id, 1)} className={styles.heartIcon} t="1571407657100" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3365" width="14" height="14"><path d="M486.4 972.8a25.6 25.6 0 0 1-12.4416-3.2256c-4.8128-2.6624-119.0912-66.6112-235.1104-171.3664-68.6592-61.952-123.4432-125.3376-162.9696-188.416C25.4976 529.3568 0 449.0752 0 371.2A269.1072 269.1072 0 0 1 268.8 102.4c50.176 0 103.4752 18.7904 150.0672 52.9408 27.2384 19.968 50.432 44.032 67.5328 69.5808a282.7264 282.7264 0 0 1 67.5328-69.5808C600.5248 121.1904 653.824 102.4 704 102.4A269.1072 269.1072 0 0 1 972.8 371.2c0 77.8752-25.5488 158.1568-75.8784 238.592-39.4752 63.0784-94.3104 126.464-162.9184 188.416-116.0192 104.7552-230.2976 168.704-235.1104 171.3664a25.6 25.6 0 0 1-12.4416 3.2256zM268.8 153.6A217.856 217.856 0 0 0 51.2 371.2c0 155.648 120.32 297.0624 221.2352 388.352A1420.1856 1420.1856 0 0 0 486.4 917.6064a1420.1856 1420.1856 0 0 0 213.9648-158.0544C801.28 668.3136 921.6 526.848 921.6 371.2A217.856 217.856 0 0 0 704 153.6c-87.1936 0-171.8784 71.7312-193.3312 136.0896a25.6 25.6 0 0 1-48.5376 0C440.6784 225.3312 355.9936 153.6 268.8 153.6z" fill="" p-id="3366"></path></svg>
                       : <svg onClick={() => this.praisedMoments(el._id, 2)} className={styles.heartIcon} t="1571407782672" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3498" width="14" height="14"><path d="M512 950.857143q-14.857143 0-25.142857-10.285714l-356.571429-344q-5.714286-4.571429-15.714286-14.857143t-31.714286-37.428571-38.857143-55.714286-30.571429-69.142857-13.428571-78.857143q0-125.714286 72.571429-196.571429t200.571429-70.857143q35.428571 0 72.285714 12.285714t68.571429 33.142857 54.571429 39.142857 43.428571 38.857143q20.571429-20.571429 43.428571-38.857143t54.571429-39.142857 68.571429-33.142857 72.285714-12.285714q128 0 200.571429 70.857143t72.571429 196.571429q0 126.285714-130.857143 257.142857l-356 342.857143q-10.285714 10.285714-25.142857 10.285714z" p-id="3499" fill="#d81e06"></path></svg>
                      }
                      <i onClick={() => this.setState({
                        spreadComment: this.state.spreadComment === el._id ? 0 : el._id
                      })} style={{marginLeft: 15}} className='anticon'><svg t="1571228280460" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2496" width="14" height="14"><path d="M716.518 392.185c-28.037 0-50.743 24.206-50.743 54.131 0 29.878 22.706 54.076 50.743 54.076 28.035 0 50.69-24.198 50.69-54.076 0.051-29.924-22.655-54.131-50.69-54.131zM513.602 392.185c-28.009 0-50.688 24.206-50.688 54.131 0 29.878 22.711 54.076 50.688 54.076 27.977 0 50.686-24.198 50.686-54.076 0-29.924-22.65-54.131-50.686-54.131z" p-id="2497"></path><path d="M817.95 93.893H209.256c-70.911 0-145.378 36.701-145.378 149.387v388.393c0 77.342 37.231 164.357 147.643 146.566h142.984c36.225 39.165 130.679 139.679 130.679 139.679 7.408 7.934 17.737 12.517 28.413 12.517 10.649 0 21.005-4.583 29.198-13.437 0.812-0.837 73.86-86.027 125.656-138.784h147.147c94.443 8.808 144.524-69.206 144.524-146.541V213.396c0.029-74.993-39.733-124.353-142.172-119.503z m82.422 149.388v388.393c0 46.304-43.817 90.735-84.688 90.735H646.56l-7.922 7.855c-42.552 42.497-102.812 108.363-126.305 135.403-28.71-30.495-104.78-110.635-126.49-134.469l-8.002-8.736H211.526c-52.679 0-87.897-44.485-87.897-90.789V243.281c0-44.182 44.592-93.606 85.628-93.606h608.745c43.464-4.853 89.648 27.509 82.37 93.606z" p-id="2498"></path><path d="M310.687 392.185c-28.005 0-50.688 24.206-50.688 54.131 0 29.878 22.739 54.076 50.688 54.076 27.984 0 50.718-24.198 50.718-54.076 0-29.924-22.683-54.131-50.718-54.131z" p-id="2499"></path></svg></i>
                    </div>
                  </div>

                  <input
                   id="commentInput"
                   onKeyDown={(e) => this.handleCommentKeyDown(e, el)}
                   maxLength="40"
                   placeholder="Enter发送评论"
                   type="text"
                   className={spreadComment === el._id ? `${styles.commentInput} ${styles.active}` : `${styles.commentInput}`}
                  />

                  {el.praised.length || el.commentChild.length ? (
                    <div className={styles.bottomWrap}>
                    {el.praised.length ? (
                      <div className={styles.praiseUserWrap}>
                        <svg style={{marginRight: 4}} t="1571407657100" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3365" width="12" height="12"><path d="M486.4 972.8a25.6 25.6 0 0 1-12.4416-3.2256c-4.8128-2.6624-119.0912-66.6112-235.1104-171.3664-68.6592-61.952-123.4432-125.3376-162.9696-188.416C25.4976 529.3568 0 449.0752 0 371.2A269.1072 269.1072 0 0 1 268.8 102.4c50.176 0 103.4752 18.7904 150.0672 52.9408 27.2384 19.968 50.432 44.032 67.5328 69.5808a282.7264 282.7264 0 0 1 67.5328-69.5808C600.5248 121.1904 653.824 102.4 704 102.4A269.1072 269.1072 0 0 1 972.8 371.2c0 77.8752-25.5488 158.1568-75.8784 238.592-39.4752 63.0784-94.3104 126.464-162.9184 188.416-116.0192 104.7552-230.2976 168.704-235.1104 171.3664a25.6 25.6 0 0 1-12.4416 3.2256zM268.8 153.6A217.856 217.856 0 0 0 51.2 371.2c0 155.648 120.32 297.0624 221.2352 388.352A1420.1856 1420.1856 0 0 0 486.4 917.6064a1420.1856 1420.1856 0 0 0 213.9648-158.0544C801.28 668.3136 921.6 526.848 921.6 371.2A217.856 217.856 0 0 0 704 153.6c-87.1936 0-171.8784 71.7312-193.3312 136.0896a25.6 25.6 0 0 1-48.5376 0C440.6784 225.3312 355.9936 153.6 268.8 153.6z" fill="" p-id="3366"></path></svg>
                        {el.praised.slice(0, 8).map((p, index) => (
                          <span key={index}>{p.Username}</span>
                        ))
                        }
                      </div>
                    ) : null}
                    {el.commentChild.length ? (
                      <div className={styles.commentShowArea}>
                        {el.commentChild.map((com, index) => (
                          <div key={index} className={styles.listCon}>
                            <span className={styles.comUser}>{com.Username}</span>
                            <span>: {com.comContent}</span>
                          </div>
                        ))
                        }
                      </div>
                    ) : null}
                    </div>
                  ) : null}
                </section>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }

  handleCommentKeyDown = (e, el) => {
    const { keyCode, target: { value } } = e;
    const input = document.querySelector('#commentInput');
    const { doComment } = this.props;

    if (keyCode === 13) {
      e.preventDefault();
      if (value.trim() === '') {
        return message.warning('评论内容不能为空');
      }

      input.value = '';
      doComment({
        serviceUrl: 'doComment',
        Username: getItem('user').Username,
        comContent: value,
        momentsId: el._id
      }).then(() => {
        this.setState({
          spreadComment: -1
        });
      });
    }
  }

  praisedMoments = (Comid, flag) => {
    const { praisedComments } = this.props;
    const { _id, Username } = getItem('user');

    praisedComments({
      serviceUrl: 'praisedComments',
      userId: _id,
      Username,
      Comid,
      flag
    })
  }

  publishMoments = () => {
    let formData = new FormData();
    const { fileList } = this.state;
    const value = document.getElementById('mInput').value;

    if (!value.trim() && !fileList.length) {
      message.warning('憨批', 2)
      return;
    }
    formData.append('userId', getItem('user')._id);
    value.trim() && formData.append('content', value);
    fileList.length && fileList.forEach(el => {
      formData.append('img', el);
    });

    fetch('http://localhost:8080/publishComments', {
      method: 'POST',
      body: formData
    }).then(() => {
      this.queryMomentsList();
      this.setState({
        showDrawer: false
      })
    })
    .catch(err => console.log('ERROR:', err));
  }

  joinToTidingsList = () => {
    const { changeTidingsList, tidingsList } = this.props;
    const { currentFriendObj } = this.state;

    const obj = tidingsList.find(el => {
      return el.receiveObj._id === this.state.currentFriendObj._id;
    })

    if (!obj) {
      changeTidingsList({
        serviceUrl: 'joinToTidingsList',
        sendId: getItem('user')._id,
        receiveId: currentFriendObj._id,
        receiveObj: currentFriendObj
      })
      .then(res => {
        if (res) {
          this.setState({
            currentSelectBox: 1,
            currentTidings: this.state.currentFriendObj._id
          }, () => {
            this.handleTidingsItemClick(currentFriendObj)
          })
        }
      })
    } else {
      this.setState({
        currentSelectBox: 1,
        currentTidings: this.state.currentFriendObj._id
      }, () => {
        this.handleTidingsItemClick(obj.receiveObj);
      })
    }
  }

  renderTargetBox = () => {
    const { currentSelectBox } = this.state;
    let rightComponent = null;

    if (currentSelectBox === 1) {
      rightComponent = (
        <Fragment>
          {this.renderTidings()}
          {this.renderChat()}
        </Fragment>
      );
    } else if (currentSelectBox === 3) {
      rightComponent = this.renderNotifyBox();
    } else if(currentSelectBox === 2) {
      rightComponent = (
        <Fragment>
          {this.renderFriendList()}
          {this.renderFriendInfo()}
        </Fragment>
      )
    } else if (currentSelectBox === 4) {
      rightComponent = this.renderMoments();
    }

    return rightComponent;
  }

  render() {
    return (
      <React.Fragment>
        <div className={styles.testWrap}>
          <p>Chat Sun</p>
          <p><Tag color='#f50'>#提示</Tag>如果没有账号，请在用户管理注册；已有请直接登录</p>
          <div className={styles.wChartWrap}>
            {getItem('user') ? (
              <Fragment>
                {this.renderMenu()}
                {this.renderTargetBox()}
              </Fragment>
            ) : <h2>😄</h2>}
          </div>
        </div>
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    notifyRecord: state.notifyRecord,
    friendList: state.friendList,
    tidingsList: state.tidingsList,
    momentsList: state.momentsList,
  }
}

export default connect(
  mapStateToProps,
  effects,
)(Chat);