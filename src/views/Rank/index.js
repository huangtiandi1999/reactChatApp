import React, { Component, Fragment } from 'react';
import axios from 'axios';
import { platformApiPrefix } from '../../../defaultSetting';

import styles from './index.less';

class Rank extends Component {
  componentDidMount() {
    axios({
      url: `${platformApiPrefix}/api/proxy`,
      method: 'get',
      withCredentials: true,
    })
    .then(res => res.data)
    .then(data => console.log(data));
  }

  render() {
    return (
      <Fragment>
        <div>B站rank</div>
      </Fragment>
    )
  }
}

export default Rank;