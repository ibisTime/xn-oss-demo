import React from 'react';
import { connect } from 'react-redux';
import { Form, Select, Input, Button, Table } from 'antd';
import { dateTimeFormat, dateFormat } from 'common/js/util';

const FormItem = Form.Item;
const Option = Select.Option;

export const listWrapper = (mapStateToProps = state=>state, mapDispatchToProps = {}) => (WrapComponent) => {
  return (
    @Form.create()
    @connect(mapStateToProps, mapDispatchToProps)
    class ListComponent extends React.Component {
      constructor(props, context){
  			super(props, context)
  			this.state = {
          selectedRowKeys: ''
  			};
  		}
      onSelectChange = (selectedRowKeys) => {
        this.setState({ selectedRowKeys });
      }
      handleReset = () => {
        this.props.form.resetFields();
        this.props.clearSearchParam();
      }
      handleSubmit = (e) => {
        e.preventDefault();
        let values = this.props.form.getFieldsValue();
        this.props.getPageTableData(1, values);
      }
      handleBtnClick = (url) => {
        switch(url) {
          case 'add':
            this.btnEvent.add
              ? this.btnEvent.add()
              : this.props.history.push(`${this.props.location.pathname}/addedit`);
            break;
          case 'edit':
            this.btnEvent.edit
              ? this.btnEvent.edit(this.state.selectedRowKeys)
              : this.props.history.push(`${this.props.location.pathname}/addedit?code=${this.state.selectedRowKeys}`);
            break;
          case 'detail':
            this.btnEvent.detail
              ? this.btnEvent.detail(this.state.selectedRowKeys)
              : this.props.history.push(`${this.props.location.pathname}/addedit?v=1&code=${this.state.selectedRowKeys}`);
            break;
          default:
            this.btnEvent[url] && this.btnEvent[url](this.state.selectedRowKeys);
        }
      }
      handleTableChange = (pagination) => {
        this.props.getPageTableData(pagination.current);
      }
      buildList = ({fields, btnEvent}) => {
        this.btnEvent = btnEvent || {};
        const columns = [];
        const searchFields = [];
        fields.forEach(f => {
          if (f.search) {
            searchFields.push(f);
          }
          let obj = {
            title: f.title,
            dataIndex: f.field
          };
          if (f.formatter) {
            obj.render = f.formatter;
          } else if (f.type === 'datetime') {
            obj.render = dateTimeFormat;
          } else if (f.type === 'date') {
            obj.render = dateFormat;
          }
          columns.push(obj);
        });
        this.columns = columns;
        return this.getPageComponent(searchFields);
      }
      getPageComponent = (searchFields) => {
        const rowSelection = {
          selectedRowKeys: this.state.selectedRowKeys,
          onChange: this.onSelectChange,
          type: 'radio'
        };
        return (
          <div>
            <Form className="search-form" layout="inline" onSubmit={this.handleSubmit}>
              {this.getSearchFields(searchFields)}
            </Form>
            <div className="tools-wrapper" style={{ marginTop: 8 }}>
              {this.props.btnList.map(v => (
                <Button key={v.code} onClick={() => {
                  this.handleBtnClick(v.url.substr(1));
                }}>{v.name}</Button>
              ))}
            </div>
            <div className="table-wrapper">
              <Table
                bordered
                rowSelection={rowSelection}
                columns={this.columns}
                rowKey={record => record.code}
                dataSource={this.props.tableList}
                pagination={this.props.pagination}
                loading={this.props.fetching}
                onChange={this.handleTableChange}
              />
            </div>
          </div>
        );
      }
      getSearchFields = (fields) => {
        const { getFieldDecorator } = this.props.form;
        const children = [];
        fields.forEach(v => {
          children.push(
            <FormItem key={v.field} label={v.title}>
              {getFieldDecorator(`${v.field}`)(
                this.getItemByType(v.type, v)
              )}
            </FormItem>
          );
        });
        children.push(
          <FormItem key='searchBtn'>
            <Button type="primary" htmlType="submit">搜索</Button>
            <Button style={{ marginLeft: 8 }} onClick={this.handleReset}>重置</Button>
          </FormItem>
        );
        return children;
      }
      getItemByType(type, item) {
        let comp;
        if (type === 'select') {
          comp = (
            <Select
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              style={{ width: 171 }}
              placeholder="请选择">
              {item.data ? item.data.map(d => (
                <Option key={d[item.keyName]} value={d[item.keyName]}>
                  {item.valueName.push ? item.valueName.map(v => d[v]).join(' ') : d[item.valueName]}
                </Option>
              )) : null}
            </Select>
          );
        } else {
          comp = <Input placeholder={item.placeholder} />;
        }
        return comp;
      }
      render() {
  			return <WrapComponent {...this.props} buildList={this.buildList}></WrapComponent>;
  		}
    }
  );
}
