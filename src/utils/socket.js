import io from 'socket.io-client';
import { getItem } from './storageUtil';

const socket = io.connect('ws://localhost:8080');

socket.on('reconnect', () => {
  /* socket.io 在谷歌浏览器上会由于标签页的切换失去焦点而断开连接
     https://github.com/socketio/socket.io/issues/3259

     该问题会导致在聊天中的任何一方重连后 socket实例变化，接收不到消息
     应为发送消息的socket还是原来的socket
  */

  if (getItem('user')) {
    socket.emit('ADD_USER', getItem('user'));
  }
})
export default socket; 