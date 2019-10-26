const express = require('express');
const proxyRoute = express.Router();
const axios = require('axios');

const apiAddress = 'https://api.bilibili.com/pgc/web/rank/list?season_type=1&day=3';
const Origin = 'https://www.bilibili.com';
const Referer = 'https://www.bilibili.com/';


proxyRoute.get('/api/proxy',async (req, res) => {
  let {data} = await axios({
    method: 'get',
    url: apiAddress,
    withCredentials: true,
    headers: {
      Origin,
      Referer,
    }
  })
  
  res.send({
    ...data
  })
})


module.exports = proxyRoute;