import React from 'react';
import { Form, Select, Input, Button } from 'antd';
import { getMenuList } from 'api/general';
import { getQueryString } from 'common/js/util';

const FormItem = Form.Item;
const Option = Select.Option;

class MenuAddEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      code: getQueryString('code', this.props.location.search),
      view: !!getQueryString('v', this.props.location.search),
      parentCodeList: [],
      type: [{
        dkey: '1',
        dvalue: '菜单'
      }, {
        dkey: '2',
        dvalue: '按钮'
      }]
    };
  }
  componentDidMount() {
    if (this.state.code) {

    } else {
      getMenuList().then(data => this.setState({parentCodeList: data}));
    }
  }
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);

      }
    });

  }
  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 16,
          offset: 8,
        },
      },
    };
    return (
      <div>
        <Form className="detail-form-wrapper" onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="父菜单编号">
            {getFieldDecorator('parentCode', {
              rules: [{
                required: true,
                message: '必填字段'
              }],
            })(
              <Select
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                style={{ width: '100%' }}
                placeholder="请选择">
                {this.state.parentCodeList.map(v => (
                  <Option key={v.code} value={v.code}>{v.code + ' ' + v.name}</Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="菜单名称">
            {getFieldDecorator('name', {
              rules: [{
                required: true,
                message: '必填字段'
              }],
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="菜单地址">
            {getFieldDecorator('url', {
              rules: [{
                required: true,
                message: '必填字段'
              }],
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="类型">
            {getFieldDecorator('type', {
              rules: [{
                required: true,
                message: '必填字段'
              }],
            })(
              <Select
                style={{ width: '100%' }}
                placeholder="请选择">
                {this.state.type.map(v => (
                  <Option key={v.dkey} value={v.dkey}>{v.dvalue}</Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="菜单顺序号">
            {getFieldDecorator('orderNo', {
              rules: [{
                required: true,
                message: '必填字段'
              }],
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="备注">
            {getFieldDecorator('remark')(
              <Input/>
            )}
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button style={{marginLeft: 20}} onClick={() => this.props.history.go(-1)}>返回</Button>
          </FormItem>
        </Form>
      </div>
    );
  }
}

export default Form.create()(MenuAddEdit);
