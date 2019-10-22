import React, { Component, Fragment } from 'react';
import {
  Icon,
  Menu,
  Button,
  Layout,
  Empty,
  Modal,
  Input,
  message,
  notification,
  Dropdown,
  Avatar,
} from 'antd';
import { Route, Switch } from 'react-router-dom'
import { connect } from 'react-redux';

import Test from './views/Test';
import Home from './views/Home';
import { effects } from './model/action';
import { getItem, removeItem } from './utils/storageUtil';
import socket from './utils/socket';

import 'antd/dist/antd.css';
import './App.css';

const { Sider, Content, Header } = Layout;

class App extends Component {
  state = {
    menuList: [
      { title: '用户管理', icon: 'team', path: '/' },
      { title: 'IM双向通讯', icon: 'wechat', path: '/im'},
    ],
    selectedKeys: ['0'],
    visible: false,
    Account: '',
    Password: '',
    a: 1,
  }

  static getDerivedStateFromProps(nextProps, preState) {
    const { location: { pathname = '/' } } = nextProps;
    let selectedKeys = null;

    preState.menuList.forEach((el, index) => {
      if (el.path === pathname) {
        selectedKeys = [`${index}`];
      }
    });
    return selectedKeys && {
      selectedKeys
    }
  }

  componentDidMount() {
    socket.on('notifyReq', data => {
      notification.info({
        message: '系统通知',
        description: `来自${data.Username}的添加好友申请，赶快去处理吧😊`,
      })
    })
  }

  handleItemClick = (el) => {
    const { history } = this.props;
    history.push(el.path);
  }

  handleLogin = () => {
    const { Account, Password } = this.state;
    const { fetchUserInfo } = this.props;

    fetchUserInfo({
      serviceUrl: 'login',
      Account,
      Password,
    })
    .then(res => {
      if (res) {
        message.success('登录成功');
        this.setState({
          visible: false,
          Account: '',
          Password: '',
        });
      }
    });
  }

  handleSignout = () => {
    const { fetchSignout } = this.props;

    fetchSignout({
      serviceUrl: 'signout',
    }).then(res => {
      if (res) {
        socket.emit('REMOVE_USER', getItem('user'), function() {
          removeItem('user');
        });
        window.location.href = 'http://localhost:3000/';
      }
    })
  }

  cancleModal = () => {
    this.setState({
      visible: false,
      Account: '',
      Password: '',
    })
  }

  render() {
    const { 
      menuList,
      selectedKeys,
      visible,
      Account,
      Password,
    } = this.state;
    const style = {
      float: 'right',
    }
    const userinfo = getItem('user') || {};
    const menu = (
      <Menu>
        <Menu.Item onClick={this.handleSignout}>退出登录</Menu.Item>
      </Menu>
    )

    return (
      <Layout>
        <Header>
          <div style={style}>
            { !userinfo.Account ? (
              <Fragment>
                <Button onClick={() => { this.setState({visible: true}) }} shape="circle" icon="user"/>
              </Fragment>
            ) : (
              <Dropdown
              overlay={menu}
              >
                <Avatar src={userinfo.headImage} size="large"/>
              </Dropdown>
            )}
          </div>
        </Header>
        
        <Layout>
          <Sider>
            <Menu
            defaultSelectedKeys={selectedKeys}
            mode="inline">
              { menuList.length ? (
                menuList.map((el, index) => (
                  <Menu.Item onClick={() => this.handleItemClick(el)} key={index}>
                    <Icon type={el.icon}/>
                    <span>{el.title}</span>
                  </Menu.Item>
                ))
              ) : <Empty description="模块开发中"/>}
            </Menu>

          </Sider>

          <Content>
            <Switch>
              <Route exact path='/' component={Home} />
              <Route path='/im' component={Test}/>
            </Switch>
          </Content>

        </Layout>
        
        <Modal
        title="登录"
        visible={visible}
        width={300}
        footer={null}
        onCancel={this.cancleModal}
        >
          <div className="modalFlex">
            <Input
             value={Account}
             maxLength={18}
             onChange={(e) => {this.setState({Account: e.target.value})}}
             prefix={<Icon type="user"/>} 
             placeholder="Username or Email"
            />
            <Input.Password 
             value={Password}
             maxLength={18}
             onChange={(e) => {this.setState({Password: e.target.value})}}
             prefix={<Icon type="key"/>}
             placeholder="Password"
            />

            <div className="innerFlex">
              <Button onClick={this.cancleModal} type="ghost">取消</Button>
              <Button onClick={this.handleLogin} type="primary">登录</Button>
            </div>
          </div>
        </Modal>
    </Layout>
    );
  }
}

const mapStateToPrope = (state) => {
  return {
    isLogin: state.isLogin
  }
}

export default connect(
  mapStateToPrope,
  effects
)(App);

