import React from 'react';
import { connect } from 'react-redux';
import { Form, Select, Input, Button, Tooltip, Icon, Spin, Upload, Modal } from 'antd';
import E from 'wangeditor';
import { getDictList } from 'api/dict';
import { getQiniuToken } from 'api/general';
import { formatImg, isUndefined, dateTimeFormat, dateFormat, showSucMsg } from 'common/js/util';
import { formItemLayout, tailFormItemLayout } from './config';
import fetch from 'common/js/fetch';

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

const uploadButton = (
  <div>
    <Icon type="plus" />
    <div className="ant-upload-text">上传</div>
  </div>
);

export const DetailWrapper = (mapStateToProps = state=>state, mapDispatchToProps = {}) => (WrapComponent) => {
  return (
    @Form.create()
    @connect(mapStateToProps, mapDispatchToProps)
    class DetailComponent extends React.Component {
      constructor(props, context){
  			super(props, context);
        this.first = true;
        this.options = {
          fields: [],
          buttons: {},
          code: '',
          view: false
        };
        this.state = {
          previewVisible: false,
          previewImage: '',
          token: '',
          textareas: {}
        };
        this.textareas = {};
  		}
      componentDidMount() {
        Object.keys(this.textareas).forEach(v => {
          let elem = document.getElementById(v);
          this.textareas[v].editor = new E(elem);
          this.textareas[v].editor.customConfig.onchange = html => {
            let result = {};
            if (!html) {
              result = {
                validateStatus: 'error',
                errorMsg: '必填字段'
              };
            } else {
              result = {
                validateStatus: 'success',
                errorMsg: ''
              };
            }
            this.setState({
              textareas: {
                ...this.state.textareas,
                [v]: result
              }
            });
            this.textareas[v].editorContent = html;
          };
          this.textareas[v].editor.create();
        });
      }
      componentWillUnmount() {
        this.props.restore();
      }
      handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
          if (err) {
            return;
          }
          let areaKeys = Object.keys(this.state.textareas);
          if (areaKeys.length && areaKeys.filter(v => this.state.textareas[v].validateStatus !== 'success').length) {
            return;
          }
          areaKeys.forEach(v => values[v] = this.textareas[v].editorContent);
          values.code = this.props.code || '';
          if (this.options.beforeSubmit && !this.options.beforeSubmit(values)) {
  					return;
          }
          let code = this.props.code ? this.options.editCode : this.options.addCode;
          this.props.doFetching();
          fetch(code, values).then(() => {
            showSucMsg('操作成功');
            this.props.cancelFetching();
            setTimeout(() => {
              this.props.history.go(-1);
            }, 1000);
          }).catch(this.props.cancelFetching);
        });
      }
      normFile = (e) => {
        if (e) {
          return e.fileList.map(v => {
            if (v.status === 'done') {
              return v.key || v.response.key;
            }
            return '';
          }).filter(v => v).join('||');
        }
        return '';
      }
      handleCancel = () => this.setState({ previewVisible: false })
      handlePreview = (file) => {
        this.setState({
          previewImage: file.url || file.thumbUrl,
          previewVisible: true,
        });
      }
      getToken() {
        if (!this.tokenFetch) {
          this.tokenFetch = true;
          getQiniuToken().then(data => {
            this.setState({ token: data.uploadToken });
          }).catch(() => this.tokenFetch = false);
        }
      }
      buildDetail = (options) => {
        this.options = {
          ...this.options,
          ...options
        };
        if (this.first) {
          this.options.code && this.options.detailCode && this.getDetailInfo();
          this.props.initStates({ code: this.options.code, view: this.options.view });
        }
        const children = [];
        this.options.fields.forEach(f => {
          if (f.type === 'select') {
            if (f.key) {
              f.keyName = f.keyName || 'dkey';
              f.valueName = f.valueName || 'dvalue';
            }
            f.readonly = this.options.view || f.readonly;
            if (!f.data) {
              f.data = this.props.selectData[f.field];
              this.first && this.getSelectData(f);
            } else if (!this.props.selectData[f.field]) {
              this.props.setSelectData({ data: f.data, key: f.field });
            }
          }
          children.push(this.getItemByType(f.type, f));
        });
        children.push(this.getBtns(this.options.buttons));
        this.first = false;
        return this.getPageComponent(children);
      }
      getDetailInfo() {
        let param = { code: this.options.code };
        this.options.beforeDetail && this.options.beforeDetail(param);
        this.props.doFetching();
        fetch(this.options.detailCode, param).then(data => {
          this.props.cancelFetching();
          this.props.setPageData(data);
        }).catch(this.props.cancelFetching);
      }
      // 获取select框的数据
      getSelectData(item) {
        if (item.key) {
          getDictList({ parentKey: item.key, bizType: item.keyCode }).then(data => {
            this.props.setSelectData({ data, key: item.field });
          }).catch(() => {});
        } else if (item.listCode) {
          let param = item.params || {};
          fetch(item.listCode, param).then(data => {
            this.props.setSelectData({ data, key: item.field });
          }).catch(() => {});
        }
      }
      getPageComponent = (children) => {
        const { previewImage, previewVisible } = this.state;
        return (
          <Spin spinning={this.props.fetching}>
            <Form className="detail-form-wrapper" onSubmit={this.handleSubmit}>
              {children}
            </Form>
            <Modal visible={previewVisible} footer={null} onCancel={this.handleCancel}>
              <img alt="图片" style={{ width: '100%' }} src={previewImage} />
            </Modal>
          </Spin>
        );
      }
      getItemByType(type, item) {
        const { getFieldDecorator } = this.props.form;
        let comp;
        let rules = this.getRules(item);
        if (type === 'select') {
          comp = this.getSelectComp(item, rules, getFieldDecorator);
        } else if (type === 'img') {
          comp = this.getImgComp(item, rules, getFieldDecorator);
        } else if (type === 'textarea' && item.normalArea) {
          comp = this.getNormalTextArea(item, rules, getFieldDecorator);
        } else if (type === 'textarea') {
          comp = this.getTextArea(item, rules, getFieldDecorator);
        } else {
          comp = this.getInputComp(item, rules, getFieldDecorator);
        }
        return comp;
      }
      getSelectComp(item, rules, getFieldDecorator) {
        let initVal = isUndefined(item.value) ? this.props.pageData[item.field] : item.value;
        return (
          <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
            {
              item.readonly ? <div className="readonly-text">{initVal}</div>
              : getFieldDecorator(item.field, {
                rules,
                initialValue: initVal,
              })(
                <Select
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  style={{ width: '100%' }}
                  placeholder="请选择">
                  {item.data ? item.data.map(d => (
                    <Option key={d[item.keyName]} value={d[item.keyName]}>
                      {item.valueName.push ? item.valueName.map(v => d[v]).join(' ') : d[item.valueName]}
                    </Option>
                  )) : null}
                </Select>
              )
            }
          </FormItem>
        );
      }
      getInputComp(item, rules, getFieldDecorator) {
        let initVal = isUndefined(item.value) ? this.props.pageData[item.field] : item.value;
        return (
          <FormItem
            className={item.hidden ? 'hidden' : ''}
            key={item.field}
            {...formItemLayout}
            label={this.getLabel(item)}>
            {
              item.readonly ? <div className="readonly-text">{initVal}</div>
              : getFieldDecorator(item.field, {
                rules,
                initialValue: initVal
              })( <Input type={item.type ? item.type : item.hidden ? 'hidden' : 'text'}/> )
            }
          </FormItem>
        );
      }
      getImgComp(item, rules, getFieldDecorator) {
        const { token } = this.state;
        !token && this.getToken();
        let initValue = [];
        if (this.props.pageData[item.field]) {
          initValue = this.props.pageData[item.field].split('||').map(key => ({
            key,
            uid: key,
            status: 'done',
            url: formatImg(key)
          }));
        }
        return (
          <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
            {getFieldDecorator(item.field, {
              rules,
              initialValue: this.props.pageData[item.field],
              getValueFromEvent: this.normFile
            })(
              this.options.code && !initValue.length && item.required
                ? <div></div>
                : (
                  <Upload
                    action="http://up-z2.qiniu.com"
                    listType="picture-card"
                    multiple={!item.single}
                    accept="image/*"
                    defaultFileList={initValue}
                    data={{ token }}
                    onPreview={this.handlePreview}
                  >
                    {item.single
                      ? this.props.form.getFieldValue(item.field)
                        ? null : uploadButton
                      : uploadButton }
                  </Upload>
                )
            )}
          </FormItem>
        )
      }
      getNormalTextArea(item, rules, getFieldDecorator) {
        let initVal = isUndefined(item.value) ? this.props.pageData[item.field] : item.value;
        return (
          <FormItem
            key={item.field}
            {...formItemLayout}
            label={this.getLabel(item)}>
            {
              item.readonly ? <div className="readonly-text">{initVal}</div>
              : getFieldDecorator(item.field, {
                rules,
                initialValue: initVal
              })( <TextArea autosize /> )
            }
          </FormItem>
        );
      }
      getTextArea(item, rules, getFieldDecorator) {
        let initVal = this.props.pageData[item.field];
        this.textareas[item.field] = this.textareas[item.field] || {};
        if (this.options.code && initVal && !this.textareas[item.field].editorContent
          && this.textareas[item.field].editor && !this.textareas[item.field].initFlag) {
          this.textareas[item.field].initFlag = true;
          this.textareas[item.field].editorContent = initVal;
          this.textareas[item.field].editor.txt.html(initVal);
        }
        if (!this.state.textareas[item.field]) {
          this.state.textareas[item.field] = {
            validateStatus: 'success',
            errorMsg: null
          };
        }
        let areaState = this.state.textareas[item.field];
        return (
          <FormItem
            key={item.field}
            {...formItemLayout}
            validateStatus={areaState.validateStatus}
            help={areaState.errorMsg || ''}
            label={this.getLabel(item)}>
            {
              item.readonly ? <div className="readonly-text" dangerouslySetInnerHTML={{__html: initVal}}></div>
              : <div id={item.field}></div>
            }
          </FormItem>
        );
      }
      getLabel(item) {
        return (
          <span className={item.required && item.type==='textarea' && !item.normalArea ? 'ant-form-item-required' : ''}>
            {item.title + (item.single ? '(单)' : '')}
            {item.help
              ? <Tooltip title={item.help}>
                  <Icon type="question-circle-o" />
                </Tooltip> : null}
          </span>
        );
      }
      getBtns(buttons) {
        return (
          <FormItem key='btns' {...tailFormItemLayout}>
            {this.options.view
              ? <Button style={{marginLeft: 20}} onClick={() => this.props.history.go(-1)}>返回</Button>
              : buttons.length
                ? buttons.map((b, i) => (
                  <Button key={i} type={b.type || ''} onClick={() => b.handler()}>{b.title}</Button>
                ))
                : (
                  <div>
                    <Button type="primary" htmlType="submit">保存</Button>
                    <Button style={{marginLeft: 20}} onClick={() => this.props.history.go(-1)}>返回</Button>
                  </div>
                )
            }
          </FormItem>
        );
      }
      getRules(item) {
        let rules = [];
        if (item.required) {
          rules.push({
            required: true,
            message: '必填字段'
          });
        }
        return rules;
      }
      render() {
  			return <WrapComponent {...this.props} buildDetail={this.buildDetail}></WrapComponent>;
  		}
    }
  );
}
