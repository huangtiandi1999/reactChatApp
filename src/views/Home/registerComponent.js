import React, { Component } from 'react';
import { Form, Input, Button } from 'antd';
import { effects } from '../../model/action';
import { connect } from 'react-redux';

class RegisterComponent extends Component {
  state = {
    Account: '',
  }

  handleSubmit = e => {
    const { registerAccount } = this.props;

    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        registerAccount({
          serviceUrl: 'registerAccount',
          ...values,
        })
      }
    });
  }

  // confirmAccount = (_, value, callback) => {
  //   if (value) {
  //     this.props.confirmAccount({
  //       serviceUrl: 'confirmAccount',
  //       Account: value,
  //     }).then(res => {
  //       if (!res.success && res.showErr) {
  //         callback('该账号已被注册，请重新输入其他账号！');
  //       }
  //     })
  //   } else {
  //     callback()
  //   }
  // }

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 5 },
        sm: { span: 5 },
        md: { span: 5},
      },
      wrapperCol: {
        xs: { span: 10 },
        sm: { span: 10 },
        md: { span: 9 }
      },
    }
    const tailFormItemLayout = {
      wrapperCol: {
        xs: { span: 24, offset: 4 },
        sm: { span: 24, offset: 8 },
        md: { span: 24, offset: 8 },
      },

    }

    return (
      <Form
       {...formItemLayout}
       onSubmit={this.handleSubmit}
      >
        <Form.Item label="Account"
         extra="例如:123456，当然宁无法注册已经存在的Account"
        >
          {getFieldDecorator('Account', {
            rules: [
              {
                required: true,
                message: 'Please input your Account!'
              }
            ],
            validateTrigger: 'onChange',
          })(<Input autoComplete="off"/>)}         
        </Form.Item>
        <Form.Item label="Password">
          {getFieldDecorator('Password', {
            rules: [
              {
                required: true,
                message: 'Please input your Password!',
                whitespace: true,
              },
              {
                min: 6,
              }
            ]
          })(<Input.Password/>)}
        </Form.Item>
        <Form.Item label="Username">
          {getFieldDecorator('Username', {
            rules: [
              {
                required: true,
                message: 'Please input your Username!',
                whitespace: true,
              },
              {
                max: 16,
              }
            ]
          })(<Input autoComplete="off"/>)

          }
        </Form.Item>
        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" onClick={this.handleSubmit}>Register</Button>
        </Form.Item>
      </Form>
    )
  }
}

const WrappedComponent = Form.create({ name: 'register_normal' })(RegisterComponent);

export default connect(
  state => ({errMessage: state.errMessage }),
  effects,
)(WrappedComponent);