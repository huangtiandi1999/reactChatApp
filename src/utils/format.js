// const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const oneday = 24 * 3600 * 1000;
const oneMin = 60 * 1000;
const oneHour = 60 * 60 * 1000;
const interval = {
  twoday: 2 * oneday,
  ago: 2 * oneMin, // 两分钟之前 展示刚刚
}

/**
 * 
 * @param {Date} time 可以是时间戳或者Date对象
 * @param {Number} typeId 描述格式化时间的模式
 * @returns {String} 格式化后的字符串
 */
export default function formatTime(time, typeId = 1) {
  const timeObj = new Date(time);
  const smallHour = new Date().setHours(0, 0, 0, 0); // 当天的凌晨时间戳
  const leaveHour = smallHour - oneday; // 前一天凌晨 
  const gap = +Date.now() - time; // 当前时间和消息时间的时间戳差
  let formatStr = '';
  let y = timeObj.getFullYear(),
      m = timeObj.getMonth() + 1,
      d = timeObj.getDate(),
      // week = timeObj.getDay(),
      h = timeObj.getHours() >= 10 ? timeObj.getHours() : `0${timeObj.getHours()}`,
      min = timeObj.getMinutes() >= 10 ? timeObj.getMinutes() : `0${timeObj.getMinutes()}`,
      forn = parseInt(h, 10) > 12 ? '下午' : (parseInt(h, 10) === 12 ? '中午' : '上午');

  if (gap <= interval.ago) {
    formatStr = `刚刚`;
    return formatStr;
  }
  // 聊天消息
  if (typeId === 1) {
    if (time > leaveHour && time < smallHour) {
      // 如果消息时间处于今天凌晨和昨天凌晨之间 显示为昨天
      // 如果时间差在一天之内 分三种：在凌晨之前, 在凌晨之后 两小时内和外
      formatStr = `昨天 ${h}:${min}`;
    } else if (time >= smallHour) { 
      // 如果消息时间大于当天的凌晨时间 2小时 我们就正常展示 例如03:20
      if (time - smallHour > 2 *3600 * 1000) {
        formatStr = `${forn} ${h}:${min}`;
      } else if (time - smallHour <= 2 * 3600 * 1000) {
        formatStr = `凌晨 ${h}:${min}`;
      }
    } else if (y === (new Date()).getFullYear()){
      formatStr = `${m}月${d}日 ${h}:${min}`;
    } else {
      formatStr = `${y}年${m}月`;
    }
  } else {
    if (gap > interval.ago && gap < oneHour) {
      // 一小时以内的消息显示规则为 刚刚或者 mm分钟前
      formatStr = `${Math.floor(gap / oneMin)}分钟前`;
    } else if (time >= leaveHour && time < smallHour) {
      formatStr = '昨天'
    } else if (time >= smallHour) {
      formatStr = `${Math.floor(gap / oneHour)}小时前`;
    } else if (time < leaveHour && gap <= 30 * oneday) {
      formatStr = `${Math.ceil(gap / oneday)}天前`;
    } else {
      formatStr = `${m}月${d}日`;
    }
  }

  return formatStr;
}

export function formatNotifyTime(time) {
  const date = new Date(time);
  let y = date.getFullYear(),
      m = date.getMonth() + 1,
      d = date.getDate(),
      h = date.getHours() >= 10 ? date.getHours() : `0${date.getHours()}`,
      min = date.getMinutes() >= 10 ? date.getMinutes() : `0${date.getMinutes()}`;
  
  let nowY = (new Date()).getFullYear();

  if (nowY > y) {
    return `${y}-${m}-${d}`;
  }

  return `${m}-${d} ${h}:${min}`;
}

// 格式化好友列表的数组
export function formatFriendList(arr, id) {
  return arr.map(item => (item.Auid._id !== id ? item.Auid : item.Ruid));
}

export function confirmKeyInObjArray(arr, key, value) {
  const target = arr.find(el => el[key] === value);

  return target ? true : false;
}
