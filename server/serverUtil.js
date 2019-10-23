const fs = require('fs');
const path = require('path');

function reNameImg(imgData) {
  let newData;

  if (Array.isArray(imgData)) {
    newData = imgData.map(el => {
      let newPath = `${path.join(__dirname, './uploadImg')}/${el.name}`;
      fs.renameSync(el.path, newPath);
      return `uploadImg/${el.name}`
    })
  } else {
    newPath = `${path.join(__dirname, './uploadImg')}/${imgData.name}`;
    fs.renameSync(imgData.path, newPath);
    newData = [`uploadImg/${imgData.name}`];
  }

  return newData;
}

// 搜索好友列表的格式化


// 格式化好友列表为_id数组
function formatFriendlistToIdArray(arr = [], id) {
  if (!arr.length) {
    return arr;
  }

  return arr.map(el => el.Auid.toString() === id ? el.Ruid.toString() : el.Auid.toString());
}

// notifyRecord数组去重
function uniqueArray(arr = [], key, deep) {
  if (!arr.length) {
    return arr;
  }

  let map = new Map();

  return arr.reduce((pre, cur) => {
    if (!map.has(cur[key][deep])) {
      map.set(cur[key][deep], true);
      pre.push(cur);
    }
    return pre;
  }, []);
}

// 搜索用户结果格式化
function formatUserList(preArr, vinArr, key) {
  let a = formatFriendlistToIdArray(vinArr, key);
  console.log(a);
  console.log(typeof a[0]);

  if (!preArr.length || !vinArr.length) {
    return preArr;
  }

  return preArr.map(el => ({...el, status: a.indexOf(el._id.toString())}))
}


module.exports = {
  reNameImg,
  formatFriendlistToIdArray,
  uniqueArray,
  formatUserList,
}