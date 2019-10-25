import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import {
  Input,
  Tag,
  Result,
  Button,
  Modal,
  message,
} from 'antd';

import { effects } from '../../model/action';
import { debounce } from '../../utils/request';
import { getItem } from '../../utils/storageUtil';
import WrappedComponent from './registerComponent';
import socket from '../../utils/socket';

import styles from './index.less';

const { Search } = Input;

class Home extends Component {
  state = {
    keyword: '',
    modalShow: false,
    targetUser: null,
    requestMessage: '',
  }

  handleSearchBtnPress = value => {
    console.log(value);
  }

  handleKeyChange = debounce((e) => {
    const { target: { value } } = e;
    const { fetchUserList } = this.props;
    const { _id, Account } = getItem('user');

    this.setState({
      keyword: value,
    })

    value.trim() && fetchUserList({
      serviceUrl: 'userlist',
      userId: _id,
      Account,
      keyword: value.trim(),
    });
  }, 500)

  renderSearchResult = () => {
    const { userlist = [] } = this.props;
    const { keyword } = this.state;

    return (
      <div className={styles.searchBoxWrap}>
        { userlist.length ? (
          <ul className={styles.searchBox}>
            <div className={styles.resultHeader}>
              搜索结果
            </div>
            { userlist.map((el, index) => (
              <li
              
              key={index}
              className={styles.searchListItem}
              >
                <img
                alt="头像"
                className={styles.headImage}
                src={el.headImage}
                />
                <div className={styles.headInfo}>
                  <span>{el.Username}</span>
                  <span>{`（${el.Account}）`}</span>
                </div>
                {el.status === -1
                  ? <Button onClick={() => this.setState({modalShow: true, targetUser: el})} size="small" shape="round" icon="user-add"/>
                  : <span className={styles.status}>已添加</span>
                }
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.notfoundStyle}>
            No results found for query {`"${keyword}"`}
          </div>
        )}
        <footer>
          Search by Mongoose
        </footer>
      </div>
    )
  }

  renderRegisterSuccessBefore = () => {
    return (
      <Fragment>
        <p>
          <Tag color="#f50">#提示</Tag>已有账户可以直接登录，如果没有请
          <button className={styles.registerBtn} type="link">注册</button>
        </p>
        <WrappedComponent/>
      </Fragment>
    )
  }

  renderRegisterSuccessAfter = () => {
    return (
      <Result
      status="success"
      title="Successfully"
      subTitle="现在宁可以选择登录，或者仍然以游客的身份继续访问我的网站"
      />
    )
  }

  renderLoginBefore = () => {
    const { register } = this.props;

    return register ? this.renderRegisterSuccessAfter() : this.renderRegisterSuccessBefore();
  }

  renderLoginAfter = () => {
    const { keyword } = this.state;

    return (
      <Fragment>
        <Search
         autoComplete="off"
         placeholder="搜索已注册用户（防抖）"
         style={{ width: 250 }}
         onSearch={value => this.handleSearchBtnPress(value)}
         onChange={this.handleKeyChange}
         />
         {keyword.trim() && this.renderSearchResult()}
      </Fragment>
    )
  }

  handleRequestAddFriend = () => {
    const { targetUser, requestMessage } = this.state;
    const { _id, Username } = getItem('user');
    const { requestFriend } = this.props;

    requestFriend({
      serviceUrl: 'requestFriend',
      Auid: _id,
      Ruid: targetUser._id,
      requestMessage, 
      status: 0,
    })
    .then(res => {
      if (res) {
        this.setState({
          modalShow: false,
          requestMessage: '',
        })
        message.success('添加好友请求已经发送', 2);
        socket.emit('rFriend', { Account: targetUser.Account, Username });
      }
    })
  }

  render() {
    return (
       <div className={styles.wrapper}>
         { getItem('user') ? this.renderLoginAfter() : this.renderLoginBefore() }

         <Modal
         title="验证消息"
         mask={false}
         visible={this.state.modalShow}
         onCancel={() => this.setState({modalShow: false, targetUser: null})}
         width={340}
         footer={null}
         >
           <p>验证人需要验证您的身份，请输入验证信息：</p>
           <Input.TextArea onChange={(e) => this.setState({requestMessage: e.target.value})} value={this.state.requestMessage} rows={3}/>
           <footer className={styles.modalFooter}>
             <Button onClick={this.handleRequestAddFriend} block type="danger">发送</Button>
           </footer>
         </Modal>
       </div>
    );
  }
}

const mapStateToProps = (state) => ({
  userlist: state.userlist,
  register: state.register
});

export default connect(
  mapStateToProps,
  effects,
)(Home)