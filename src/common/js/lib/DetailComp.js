import React from 'react';
import { Form, Select, Input, Button, Tooltip, Icon, Spin, Upload,
  Modal, Cascader, DatePicker, Table } from 'antd';
import moment from 'moment';
import 'moment/locale/zh-cn';
import E from 'wangeditor';
import { getDictList } from 'api/dict';
import { getQiniuToken } from 'api/general';
import { formatFile, formatImg, isUndefined, dateTimeFormat, dateFormat, getUserName,
  tempString, moneyFormat, moneyParse, showSucMsg, showErrMsg, showWarnMsg } from '../util';
import { UPLOAD_URL, PIC_PREFIX, formItemLayout, tailFormItemLayout } from '../config';
import fetch from '../fetch';
import cityData from './city';
import locale from './date-locale';

moment.locale('zh-cn');
const { Item: FormItem } = Form;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const DATE_FORMAT = 'YYYY-MM-DD';
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const imgUploadBtn = (
  <div>
    <Icon type="plus" />
    <div className="ant-upload-text">上传</div>
  </div>
);
const fileUploadBtn = (
  <Button>
    <Icon type="upload" /> 上传
  </Button>
);

export default class DetailComp extends React.Component {
  constructor(props, context) {
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
      textareas: {},
      fetching: {},
      o2mSKeys: {},
      searchData: {},
      modalVisible: false,
      modalOptions: {}
    };
    this.o2mFirst = {};
    this.textareas = {};
  }
  componentDidMount() {
    let _this = this;
    Object.keys(this.textareas).forEach(v => {
      let elem = document.getElementById(v);
      _this.textareas[v].editor = new E(elem);
      _this.textareas[v].editor.customConfig.uploadFileName = 'file';
      _this.textareas[v].editor.customConfig.uploadImgMaxSize = 10 * 1024 * 1024;
      _this.textareas[v].editor.customConfig.showLinkImg = false;
      _this.textareas[v].editor.customConfig.uploadImgHooks = {
        customInsert: (insertLinkImg, result) => {
          insertLinkImg(PIC_PREFIX + result.key);
        },
        before: (formdata, xhr, editor, file) => {
          formdata.append('token', _this.state.token);
          formdata.append('key', file.name + '_' + new Date().getTime());
        }
      };
      _this.textareas[v].editor.customConfig.uploadImgServer = UPLOAD_URL;
      _this.textareas[v].editor.customConfig.onchange = html => {
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
        _this.setState({
          textareas: {
            ..._this.state.textareas,
            [v]: result
          }
        });
        _this.textareas[v].editorContent = html;
      };
      _this.textareas[v].editor.create();
    });
  }
  componentWillUnmount() {
    this.props.restore();
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
      f.readonly = isUndefined(f.readonly) ? this.options.view : f.readonly;
      if (f.type === 'citySelect') {
        f.cFields = f.cFields || ['province', 'city', 'area'];
      } else if (f.type === 'select') {
        if (f.key) {
          f.keyName = f.keyName || 'dkey';
          f.valueName = f.valueName || 'dvalue';
        }
        if (!f.data) {
          f.data = this.props.selectData[f.field];
          this.first && this.getSelectData(f);
        } else if (!this.props.selectData[f.field]) {
          setTimeout(() => {
            this.props.setSelectData({ data: f.data, key: f.field });
          }, 20);
        }
      }
      children.push(this.getItemByType(f.type, f));
    });
    children.push(this.getBtns(this.options.buttons));
    this.first = false;
    return this.getPageComponent(children);
  }
  beforeSubmit(err, values) {
    if (err) {
      return false;
    }
    let areaKeys = Object.keys(this.state.textareas);
    if (areaKeys.length && areaKeys.filter(v => this.state.textareas[v].validateStatus !== 'success').length) {
      return false;
    }
    areaKeys.forEach(v => values[v] = this.textareas[v].editorContent);
    values[this.options.key || 'code'] = this.props.code || '';
    this.options.fields.forEach(v => {
      if (v.amount) {
        values[v.field] = moneyParse(values[v.field], v.amountRate);
      } else if (v.type === 'citySelect') {
        let mid = values[v.field].map(a => a === '全部' ? '' : a);
        v.cFields.forEach((f, i) => {
          values[f] = mid[i];
        });
      } else if (v.type === 'date' || v.type === 'datetime') {
        let format = v.type === 'date' ? DATE_FORMAT : DATETIME_FORMAT;
        if (v.rangedate) {
          let bDate = values[v.field] ? [...values[v.field]] : [];
          if (bDate.length) {
            v.rangedate.forEach((d, i) => {
              values[d] = bDate[i].format(format);
            });
          }
        } else {
          values[v.field] = values[v.field] ? values[v.field].format(format) : values[v.field];
        }
      } else if (v.type === 'o2m') {
        values[v.field] = this.props.pageData[v.field];
      }
    });
    values.updater = values.updater || getUserName();
    return values;
  }
  customSubmit = (handler) => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      let params = this.beforeSubmit(err, values);
      if (!params) {
        return;
      }
      handler && handler(params);
    });
  }
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      let params = this.beforeSubmit(err, values);
      if (!params || (this.options.beforeSubmit && !this.options.beforeSubmit(params))) {
        return;
      }
      let code = this.props.code ? this.options.editCode : this.options.addCode;
      this.props.doFetching();
      fetch(code, params).then(() => {
        showSucMsg('操作成功');
        this.props.cancelFetching();
        if (this.options.onOk) {
          this.options.onOk();
        } else {
          setTimeout(() => {
            this.props.history.go(-1);
          }, 1000);
        }
      }).catch(this.props.cancelFetching);
    });
  }
  onCancel = () => {
    this.options.onCancel ? this.options.onCancel() : this.props.history.go(-1);
  }
  normFile = (e) => {
    if (e) {
      return e.fileList.map(v => {
        if (v.status === 'done') {
          return v.key || v.response.key;
        } else if (v.status === 'error') {
          showErrMsg('文件上传失败');
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
      previewVisible: true
    });
  }
  handleFilePreview = (file) => {
    if (file.status === 'done') {
      let key = file.key || (file.response && file.response.key) || '';
      window.open(formatFile(key), true);
    } else {
      let msg = file.status === 'uploading' ? '文件还未上传完成' : '文件上传失败';
      showErrMsg(msg);
    }
  }
  getToken() {
    if (!this.tokenFetch) {
      this.tokenFetch = true;
      getQiniuToken().then(data => {
        this.setState({ token: data.uploadToken });
      }).catch(() => this.tokenFetch = false);
    }
  }
  getUploadData = (file) => {
    return { token: this.state.token };
  }
  getDetailInfo() {
    let key = this.options.key || 'code';
    let param = { [key]: this.options.code };
    this.options.beforeDetail && this.options.beforeDetail(param);
    this.props.doFetching();
    fetch(this.options.detailCode, param).then(data => {
      this.props.cancelFetching();
      this.props.setPageData(data);
    }).catch(this.props.cancelFetching);
  }
  setSearchLoading(item, flag) {
    this.setState({
      fetching: {
        ...this.state.fetching,
        [item.field]: flag
      }
    });
  }
  // 获取搜索框数据
  searchSelectChange({ keyword, item, start = 1, limit = 20, key }) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    // 第一次页面加载的时候，如果是修改页面，则会传入key，用于获取初始的下拉框数据
    if (!key) {
      this.setSearchLoading(item, true);
      this.props.setSelectData({ data: [], key: item.field });
    }
    let params = item.params || {};
    params.start = start;
    params.limit = limit;
    key = key || item.searchName || item.keyName || item.field;
    params[key] = keyword;
    this.timeout = setTimeout(() => {
      fetch(item.pageCode, params).then(data => {
        !key && this.setSearchLoading(item, false);
        params.start++;
        let list = this.props.selectData[item.field] || [];
        list = start === 1 ? [] : list;
        this.props.setSelectData({ data: list.concat(data.list), key: item.field });
      }).catch(() => {
        !key && this.setSearchLoading(item, false);
      });
    }, 300);
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
  // 生成页面结构
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
  // 根据类型获取相应的组件
  getItemByType(type, item) {
    const { getFieldDecorator } = this.props.form;
    let rules = this.getRules(item);
    let initVal = this.getRealValue(item);
    switch(type) {
      case 'o2m':
        return this.getTableItem(item, initVal, rules, getFieldDecorator);
      case 'select':
        // 解析select的数据，如详情查询返回userId，则根据该字段的配置把它解析成可以读懂的信息
        if (item.pageCode && initVal && !this.getItemByType[item.field]) {
          this.getItemByType[item.field] = true;
          this.searchSelectChange({ item, keyword: initVal, key: item.field });
        }
        return item.pageCode
          ? this.getSearchSelectItem(item, initVal, rules, getFieldDecorator)
          : this.getSelectComp(item, initVal, rules, getFieldDecorator);
      case 'date':
      case 'datetime':
        return item.rangedate
          ? this.getRangeDateItem(item, initVal, rules, getFieldDecorator, type === 'datetime')
          : this.getDateItem(item, initVal, rules, getFieldDecorator, type === 'datetime');
      case 'img':
        return this.getImgComp(item, initVal, rules, getFieldDecorator);
      case 'file':
        return this.getFileComp(item, initVal, rules, getFieldDecorator);
      case 'textarea':
        return item.normalArea
          ? this.getNormalTextArea(item, initVal, rules, getFieldDecorator)
          : this.getTextArea(item, initVal, rules, getFieldDecorator);
      case 'citySelect':
        return this.getCitySelect(item, initVal, rules, getFieldDecorator);
      case 'lnglat':
        return this.getLngLatComp(item, initVal, rules, getFieldDecorator);
      default:
        return this.getInputComp(item, initVal, rules, getFieldDecorator);
    }
  }
  onSelectChange = (selectedRowKeys, key) => {
    this.setState((prevState, props) => ({
      o2mSKeys: {
        ...prevState.o2mSKeys,
        [key]: selectedRowKeys
      }
    }));
  }
  getTableItem(item, initVal, rules, getFieldDecorator) {
    const columns = this.getTableColumns(item);
    const { o2mSKeys } = this.state;
    o2mSKeys[item.field] = o2mSKeys[item.field] || [];
    const dataSource = initVal || [];
    const selectedRowKeys = o2mSKeys[item.field];
    const rowSelection = {
      selectedRowKeys,
      onChange: (selectedRowKeys) => this.onSelectChange(selectedRowKeys, item.field)
    };
    const hasSelected = selectedRowKeys.length > 0;
    return (
      <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
        {this.getTableBtn(item, hasSelected)}
        <Table {...this.getTableProps(rowSelection, columns, item, dataSource)} />
      </FormItem>
    );
  }
  getTableProps(rowSelection, columns, item, dataSource) {
    const props = {
      columns,
      dataSource,
      rowSelection,
      bordered: true,
      rowKey: record => record[item.options.rowKey || 'code']
    };
    if (item.options.scroll) {
      props.scroll = item.options.scroll;
    }
    return props;
  }
  getTableBtn(item, hasSelected) {
    if (!item.options.buttons) {
      let _this = this;
      item.options.buttons = [{
        title: '确认',
        handler: (params, doFetching, cancelFetching, handleCancel) => {
          let key = item.rowKey || 'code';
          params[key] = isUndefined(params[key]) ? new Date().getTime() : params[key];
          let arr = _this.props.pageData[item.field] || [];
          _this.props.setPageData({
            ..._this.props.pageData,
            [item.field]: [...arr, params]
          });
          setTimeout(() => {
            _this.setState((prevState, props) => ({
              o2mSKeys: { ...prevState.o2mSKeys, [item.field]: [params[key]] }
            }));
          }, 300);
          handleCancel();
        },
        check: true
      }];
    }
    return item.readonly ? null : (
      <div style={{ marginBottom: 16 }}>
        {item.options.add ? <Button
          type="primary"
          style={{marginRight: 20}}
          onClick={() => {
            this.setState({
              modalVisible: true,
              modalOptions: {
                ...item.options,
                useData: null,
                code: null
              }
            });
          }}
        >新增</Button> : null}
        {item.options.edit ? <Button
          type="primary"
          disabled={!hasSelected}
          style={{marginRight: 20}}
          onClick={() => {
            let keys = this.state.o2mSKeys[item.field];
            if (!keys.length || keys.length > 1) {
              showWarnMsg('请选择一条记录');
              return;
            }
            let key = keys[0];
            let keyName = item.rowKey || 'code';
            let useData = this.props.pageData[item.field].filter((v) => v[keyName] === key)[0];
            this.setState({
              modalVisible: true,
              modalOptions: {
                ...item.options,
                code: key,
                useData
              }
            });
          }}
        >修改</Button> : null}
        {item.options.delete ? <Button
          type="primary"
          disabled={!hasSelected}
          style={{marginRight: 20}}
          onClick={() => {
            let keys = this.state.o2mSKeys[item.field];
            if (!keys.length || keys.length > 1) {
              showWarnMsg('请选择一条记录');
              return;
            }
            let key = keys[0];
            let keyName = item.rowKey || 'code';
            let arr = this.props.pageData[item.field].filter((v) => v[keyName] !== key);
            this.props.setPageData({
              ...this.props.pageData,
              [item.field]: arr
            });
            this.setState((prevState, props) => ({
              o2mSKeys: { ...prevState.o2mSKeys, [item.field]: [] }
            }));
          }}
        >删除</Button> : null}
      </div>
    );
  }
  getTableColumns(item) {
    const columns = item.options.fields;
    let first = this.o2mFirst[item.field];
    first = isUndefined(first) ? true : first;
    let result = [];
    columns.forEach(f => {
      let obj = {
        title: f.title,
        dataIndex: f.field
      };
      if (f.type === 'datetime') {
        obj.render = (v) => {
          return f.nowrap ? <span style={{whiteSpace: 'nowrap'}}>{dateTimeFormat(v)}</span> : dateTimeFormat(v);
        };
      } else if (f.type === 'date') {
        obj.render = (v) => {
          return f.nowrap ? <span style={{whiteSpace: 'nowrap'}}>{dateFormat(v)}</span> : dateFormat(v);
        };
      } else if (f.type === 'select') {
        if (f.key) {
          f.keyName = f.keyName || 'dkey';
          f.valueName = f.valueName || 'dvalue';
        }
        if (!f.data) {
          f.data = this.state.searchData[f.field];
          first && this.getO2MSelectData(f);
        } else if (!this.state.searchData[f.field]) {
          setTimeout(() => {
            this.setSearchData({ data: f.data, key: f.field });
          }, 20);
        }
        obj.render = (value) => {
          let val = '';
          if (value && f.data) {
            let item = f.data.find(v => v[f.keyName] === value);
            val = item
              ? item[f.valueName]
                ? item[f.valueName]
                : tempString(f.valueName, item)
              : '';
          }
          return f.nowrap ? <span style={{whiteSpace: 'nowrap'}}>{val}</span> : val;
        };
      } else if (f.type === 'img') {
        obj.render = (value) => <img style={{maxWidth: 25, maxHeight: 25}} src={PIC_PREFIX + value}/>;
      }
      if (f.amount) {
        obj.render = (v, d) => <span style={{whiteSpace: 'nowrap'}}>{moneyFormat(v, d)}</span>;
      }
      if (!obj.render) {
        if (f.render) {
          obj.render = f.render;
        } else {
          obj.render = (v) => f.nowrap ? <span style={{whiteSpace: 'nowrap'}}>{v}</span> : v;
        }
      }
      if (f.fixed) {
        obj.fixed = f.fixed;
        obj.width = f.width || 100;
      }
      result.push(obj);
    });
    this.o2mFirst[item.field] = false;
    return result;
  }
  // 获取o2m的select框的数据
  getO2MSelectData(item) {
    if (item.key) {
      getDictList({ parentKey: item.key, bizType: item.keyCode }).then(data => {
        this.setSearchData({ data, key: item.field });
      }).catch(() => {});
    } else if (item.listCode) {
      let param = item.params || {};
      fetch(item.listCode, param).then(data => {
        this.setSearchData({ data, key: item.field });
      }).catch(() => {});
    }
  }
  setSearchData({data, key}) {
    this.setState((prevState, props) => ({
      searchData: {...prevState.searchData, [key]: data}
    }));
  }
  // 获取日期选择控件
  getDateItem(item, initVal, rules, getFieldDecorator, isTime = false) {
    let format = isTime ? DATETIME_FORMAT : DATE_FORMAT;
    let places = isTime ? '选择时间' : '选择日期';
    return (
      <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
        {
          item.readonly ? <div className="readonly-text">{initVal}</div>
          : getFieldDecorator(item.field, {
            rules,
            initialValue: initVal || null
          })(
            <DatePicker
              allowClear={false}
              locale={locale}
              placeholder={places}
              format={format}
              showTime={isTime} />
          )
        }
      </FormItem>
    );
  }
  // 获取日期范围选择控件
  getRangeDateItem(item, initVal, rules, getFieldDecorator, isTime = false) {
    let format = isTime ? DATETIME_FORMAT : DATE_FORMAT;
    let places = isTime ? ['开始时间', '结束时间'] : ['开始日期', '结束日期'];
    return (
      <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
        {
          item.readonly ? <div className="readonly-text">{initVal}</div>
          : getFieldDecorator(item.field, {
            rules,
            initialValue: initVal || null
          })(
            <RangePicker
              allowClear={false}
              locale={locale}
              placeholder={places}
              ranges={{ '今天': [moment(), moment()], '本月': [moment(), moment().endOf('month')] }}
              format={format}
              showTime={isTime} />
          )
        }
      </FormItem>
    );
  }
  // 获取搜索select控件
  getSearchSelectItem(item, initVal, rules, getFieldDecorator) {
    let data;
    if (item.readonly && item.data) {
      data = item.data.filter(v => v[item.keyName] === initVal);
    }
    return (
      <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
        {
          item.readonly ? <div className="readonly-text">{data && data.length ? data[0][item.valueName] || tempString(item.valueName, data[0]) : ''}</div>
          : getFieldDecorator(item.field, {
            rules,
            initialValue: item.data ? initVal : ''
          })(
            <Select
              allowClear
              mode="combobox"
              showArrow={false}
              filterOption={false}
              onSearch={v => this.searchSelectChange({ item, keyword: v })}
              optionLabelProp="children"
              style={{ width: 200 }}
              notFoundContent={this.state.fetching[item.field] ? <Spin size="small"/> : '暂无数据'}
              placeholder="请输入关键字搜索">
              {item.data ? item.data.map(d => (
                <Option key={d[item.keyName]} value={d[item.keyName]}>
                  {d[item.valueName] ? d[item.valueName] : tempString(item.valueName, d)}
                </Option>
              )) : null}
            </Select>
          )
        }
      </FormItem>
    );
  }
  // 获取城市选择控件
  getCitySelect(item, initVal, rules, getFieldDecorator) {
    return (
      <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
        {
          item.readonly ? <div className="readonly-text">{initVal}</div>
          : getFieldDecorator(item.field, {
            rules,
            initialValue: initVal
          })(<Cascader placeholder="请选择" options={cityData}/>)
        }
      </FormItem>
    );
  }
  // 获取经纬度控件
  getLngLatComp(item, initVal, rules, getFieldDecorator) {
    return (
      <FormItem
        className={item.hidden ? 'hidden' : ''}
        key={item.field}
        {...formItemLayout}
        label={this.getLabel(item)}>
        {
          item.readonly ? <div className="readonly-text" style={item.style ? item.style : {}}>{initVal}</div>
            : (
              <Row gutter={8}>
                <Col span={16}>
                  {getFieldDecorator(item.field, {
                    rules,
                    initialValue: initVal
                  })(
                    <Input type={item.hidden ? 'hidden' : 'text'}/>
                  )}
                </Col>
                <Col span={8}>
                  <Button onClick={() => {
                    this.getLngLat(item);
                  }}>获取经纬度</Button>
                </Col>
              </Row>
            )
        }
      </FormItem>
    );
  }
  // 获取select控件
  getSelectComp(item, initVal, rules, getFieldDecorator) {
    let data;
    if (item.readonly && item.data) {
      data = item.data.filter(v => v[item.keyName] === initVal);
    }
    return (
      <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
        {
          item.readonly ? <div className="readonly-text">{data && data.length ? data[0][item.valueName] || tempString(item.valueName, data[0]) : ''}</div>
          : getFieldDecorator(item.field, {
            rules,
            initialValue: item.data ? initVal : ''
          })(
            <Select {...this.getSelectProps(item)}>
              {item.data ? item.data.map(d => (
                <Option key={d[item.keyName]} value={d[item.keyName]}>
                  {d[item.valueName] ? d[item.valueName] : tempString(item.valueName, d)}
                </Option>
              )) : null}
            </Select>
          )
        }
      </FormItem>
    );
  }
  // 获取input控件
  getInputComp(item, initVal, rules, getFieldDecorator) {
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
          })(<Input type={item.type ? item.type : item.hidden ? 'hidden' : 'text'}/>)
        }
      </FormItem>
    );
  }
  // 获取文件上传控件
  getFileComp(item, initVal, rules, getFieldDecorator, isImg) {
    let initValue = this.getFileInitVal(initVal);
    return (
      item.hidden ? null : (
        <FormItem key={item.field} {...formItemLayout} label={this.getLabel(item)}>
          {getFieldDecorator(item.field, {
            rules,
            initialValue: initVal,
            getValueFromEvent: this.normFile
          })(
            this.options.code && !initValue.length && item.required
              ? <div></div>
              : (
                <Upload {...this.getUploadProps(item, initValue, isImg)}>
                  {this.getUploadBtn(item, isImg)}
                </Upload>
              )
          )}
        </FormItem>
      )
    );
  }
  // 获取图片上传控件
  getImgComp(item, initVal, rules, getFieldDecorator) {
    return this.getFileComp(item, initVal, rules, getFieldDecorator, true);
  }
  // 获取上传控件属性
  getUploadProps(item, initValue, isImg) {
    const commProps = {
      action: UPLOAD_URL,
      multiple: !item.single,
      defaultFileList: initValue,
      data: this.getUploadData,
      showUploadList: {
        showPreviewIcon: true,
        showRemoveIcon: !item.readonly
      }
    };
    const fileProps = {
      ...commProps,
      onChange: ({fileList}) => this.setUploadFileUrl(fileList),
      onPreview: this.handleFilePreview
    };
    const imgProps = {
      ...commProps,
      onChange: ({fileList}) => this.setUploadFileUrl(fileList, true),
      onPreview: this.handlePreview,
      listType: 'picture-card',
      accept: 'image/*'
    };
    return isImg ? imgProps : fileProps;
  }
  getSelectProps(item) {
    const props = {
      showSearch: true,
      allowClear: true,
      optionFilterProp: 'children',
      filterOption: (input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0,
      style: { width: '100%' },
      placeholder: '请选择'
    };
    if (item.onChange) {
      props.onChange = item.onChange;
    }
    return props;
  }
  getNormalTextArea(item, initVal, rules, getFieldDecorator) {
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
          })(<TextArea autosize />)
        }
      </FormItem>
    );
  }
  getTextArea(item, initVal, rules, getFieldDecorator) {
    const { token } = this.state;
    !token && this.getToken();
    this.textareas[item.field] = this.textareas[item.field] || {};
    if (this.options.code && initVal && !this.textareas[item.field].editorContent &&
      this.textareas[item.field].editor && !this.textareas[item.field].initFlag) {
      this.textareas[item.field].initFlag = true;
      this.textareas[item.field].editorContent = initVal;
      this.textareas[item.field].editor.txt.html(initVal);
    }
    if (!this.state.textareas[item.field]) {
      this.setState({
        textareas: {
          ...this.state.textareas,
          [item.field]: {
            validateStatus: 'success',
            errorMsg: null
          }
        }
      });
    }
    let areaState = this.state.textareas[item.field] || {
      validateStatus: 'success',
      errorMsg: null
    };
    return (
      <FormItem
        key={item.field}
        {...formItemLayout}
        validateStatus={areaState.validateStatus}
        help={areaState.errorMsg}
        label={this.getLabel(item)}>
        {
          item.readonly ? <div className="readonly-text" dangerouslySetInnerHTML={{__html: initVal}}></div>
          : <div id={item.field}></div>
        }
      </FormItem>
    );
  }
  getFileInitVal(initVal, isImg) {
    const { token } = this.state;
    !token && this.getToken();
    let initValue = [];
    if (initVal) {
      initValue = initVal.split('||').map(key => ({
        key,
        uid: key,
        name: key,
        status: 'done',
        url: isImg ? formatImg(key) : formatFile(key),
        thumbUrl: isImg ? formatImg(key) : formatFile(key)
      }));
    }
    return initValue;
  }
  // 获取修改、详情页每个输入框的真实值
  getRealValue(item) {
    let result = this.props.pageData[item.field];
    try {
      if (item._keys) {
        result = this.getValFromKeys(item);
      } else if (!isUndefined(item.value)) {
        result = item.value;
      }
      if (item.type === 'citySelect') {
        result = this.getCityVal(item, result);
      } else if (item.type === 'date' || item.type === 'datetime') {
        result = this.getRealDateVal(item, result);
      }
      if (item.formatter) {
        result = item.formatter(result, this.props.pageData);
      } else if (item.amount) {
        result = isUndefined(result) ? '' : moneyFormat(result, item.amountRate);
      }
    } catch(e) {}
    return isUndefined(result) ? '' : result; // this.options.view ? '' :
  }
  getRealDateVal(item, result) {
    let format = item.type === 'date' ? DATE_FORMAT : DATETIME_FORMAT;
    let format1 = item.type === 'date' ? dateFormat : dateTimeFormat;
    let readonly = this.options.view || item.readonly;
    if (readonly) {
      return item.rangedate
        ? this.getRangeDateVal(item, result, format, format1, readonly)
        : result ? format1(result, format) : null;
    }
    return item.rangedate
      ? this.getRangeDateVal(item, result, format, format1)
      : result ? moment(dateTimeFormat(result), format) : null;
  }
  getRangeDateVal(item, result, format, fn, readonly) {
    let dates = item._keys && result ? result : this.props.pageData;
    let start = dates[item.rangedate[0]];
    let end = dates[item.rangedate[1]];
    if (readonly) {
      return start ? fn(start, format) + '~' + fn(end, format) : null;
    }
    return start ? [moment(fn(start), format), moment(fn(end), format)] : null;
  }
  getCityVal(item, result) {
    let cData = item._keys && result ? result : this.props.pageData;
    let prov = cData[item.cFields[0]];
    if (prov) {
      let city = cData[item.cFields[1]] ? cData[item.cFields[1]] : '全部';
      let area = cData[item.cFields[2]] ? cData[item.cFields[2]] : '全部';
      result = [prov, city, area];
    } else {
      result = [];
    }
    return result;
  }
  getValFromKeys(item) {
    let _value = {...this.props.pageData};
    let emptyObj = {};
    item._keys.forEach(key => {
      _value = isUndefined(_value[key]) ? emptyObj : _value[key];
    });
    return _value === emptyObj ? '' : _value;
  }
  getUploadBtn(item, isImg) {
    let btn = isImg ? imgUploadBtn : fileUploadBtn;
    return item.readonly
      ? null
      : item.single
        ? this.props.form.getFieldValue(item.field)
          ? null : btn
        : btn;
  }
  setUploadFileUrl(fileList, isImg) {
    let format = isImg ? formatImg : formatFile;
    fileList.forEach(f => {
      if (!f.url && f.status === 'done' && f.response) {
        f.url = format(f.response.key);
      }
    });
  }
  getLabel(item) {
    return (
      <span className={item.required && item.type === 'textarea' && !item.normalArea ? 'ant-form-item-required' : ''}>
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
        {buttons.length
          ? buttons.map((b, i) => (
            <Button
              style={{marginRight: 20}}
              key={i}
              type={b.type || ''}
              onClick={() => b.check ? this.customSubmit(b.handler) : b.handler()}>
              {b.title}
            </Button>
          ))
          : this.options.view
            ? <Button style={{marginLeft: 20}} onClick={this.onCancel}>返回</Button>
            : (
              <div>
                <Button type="primary" htmlType="submit">{this.options.okText || '保存'}</Button>
                <Button style={{marginLeft: 20}} onClick={this.onCancel}>{this.options.cancelText || '返回'}</Button>
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
    if (item.maxlength) {
      rules.push({
        min: 1,
        max: item.maxlength,
        message: `请输入一个长度最多是${item.maxlength}的字符串`
      });
    }
    if (item.email) {
      rules.push({
        type: 'email',
        message: '请输入正确格式的电子邮件'
      });
    }
    if (item.mobile) {
      rules.push({
        pattern: /^1[3|4|5|7|8]\d{9}$/,
        message: '手机格式不对'
      });
    }
    if (item['Z+']) {
      rules.push({
        pattern: /^[1-9]\d*$/,
        message: '请输入正整数'
      });
    }
    if (item.number) {
      rules.push({
        pattern: /^-?\d+(\.\d+)?$/,
        message: '请输入合法的数字'
      });
    }
    if (item.positive) {
      rules.push({
        pattern: /^\d+(\.\d+)?$/,
        message: '请输入正数'
      });
    }
    if (item.integer) {
      rules.push({
        pattern: /^-?\d+$/,
        message: '请输入合法的整数'
      });
    }
    if (item.idCard) {
      rules.push({
        pattern: /^([1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3})|([1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X|x))$/,
        message: '请输入合法的身份证号'
      });
    }
    return rules;
  }
}