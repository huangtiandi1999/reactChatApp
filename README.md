## 如何开始
1. git clone到本地之后 cd reactChatApp

2. npm install 安装依赖(确保已安装node环境)

3. 安装mongoDB，并启动数据库

4. cd server, node serve.js 启动服务器

5. npm run start 启动程序

## 已完成

- [x] 登录

- [x] 注册(前端验证)

- [x] 用户查询(搜索关键字高亮)

- [x] 添加好友

- [x] 即时通讯

- [x] 发送消息是双方头像下方展示最新一条消息

- [x] 接收到非来自消息队列的消息后，及时生成消息窗口并置顶

- [x] 请求通知(对方在线时，将收到左边弹出的通知)

- [x] 同意或拒绝对方的添加好友请求

- [x] 发朋友圈，支持文字、图片、文字➕图片

- [x] 朋友圈点赞(A点赞B，与A无好友关系的无法看到点赞)

- [x] 朋友圈评论

- [x] 消息时间以及朋友圈时间的格式化(参考的微信)

## 未完成

- [ ] 删除好友

- [ ] 删除消息队列中的一项

- [ ] 第一次添加好友成功系统提示消息(类似qq)

- [ ] 群聊

- [ ] 朋友圈评论的回复

## 部分展示

<img src="https://raw.githubusercontent.com/wojiaowanyuxuan/gitImg/master/chatImg1.png" height="50%" width="50%"/><img src="https://raw.githubusercontent.com/wojiaowanyuxuan/gitImg/master/chatImg2.png" height="50%" width="50%"/>

<img src="https://raw.githubusercontent.com/wojiaowanyuxuan/gitImg/master/chatImg4.png" height="50%" width="50%"/><img src="https://raw.githubusercontent.com/wojiaowanyuxuan/gitImg/master/chatImg5.png" height="50%" width="50%"/>

<img src="https://raw.githubusercontent.com/wojiaowanyuxuan/gitImg/master/chatImg3.png" height="50%" width="50%"/><img src="https://raw.githubusercontent.com/wojiaowanyuxuan/gitImg/master/chatImg6.png" height="50%" width="50%"/>

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

