import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import { combineReducers } from './model/reducer';
import * as serviceWorker from './serviceWorker';

import App from './App';
import './index.css';

const store = createStore(
  combineReducers,
  applyMiddleware(thunkMiddleware),
);

ReactDOM.render(
    <Provider store={store}>
      <Router>
        <Route component={App}></Route>
      </Router>
    </Provider>
  , document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
