import axios from 'axios';
import { platformApiPrefix } from '../../defaultSetting';

export function commonService(params) {
  const { serviceUrl } = params;

  delete params.serviceUrl;

  return axios({
    url: `/${serviceUrl}`,
    data: params,
    method: 'POST',
    baseURL: platformApiPrefix,
    withCredentials: true
  })
  .then(res => {
    return res.data;
  })
  .catch(err => {
    return err;
  });
}

/**
 * 
 * @param {Function} fn 延迟执行函数
 * @param {Number} delay 延迟时间
 * @param {Function} imCallback 立即执行函数
 */
export function debounce(fn, delay, imCallback = null) {
  let timer = null;

  return function(e) {
    if (timer) clearTimeout(timer);
    imCallback && imCallback();
    e.persist && e.persist();

    timer = setTimeout(() => {
      fn.call(null, e);
    }, delay);
  }
}
