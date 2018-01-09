import React from 'react';
import { connect } from 'react-redux';
import { Form, Select, Input, Button, Table } from 'antd';
import { dateTimeFormat, dateFormat, showWarnMsg, showSucMsg, showDelConfirm } from 'common/js/util';
import { getOwnerBtns } from 'api/menu';
import { getDictList } from 'api/dict';
import fetch from 'common/js/fetch';

const FormItem = Form.Item;
const Option = Select.Option;

export const listWrapper = (mapStateToProps = state=>state, mapDispatchToProps = {}) => (WrapComponent) => {
  return (
    @Form.create()
    @connect(mapStateToProps, mapDispatchToProps)
    class ListComponent extends React.Component {
      constructor(props, context){
  			super(props, context);
  			this.state = {
          selectedRowKeys: [],
          selectedRows: []
  			};
        this.first = true;
        this.options = {
          fields: [],
          rowKey: 'code',
          btnEvent: {},
          singleSelect: true,
          searchParams: {}
        };
  		}
      onSelectChange = (selectedRowKeys, selectedRows) => {
        this.setState({ selectedRowKeys, selectedRows });
      }
      handleRowClick = (record) => {
        let { selectedRowKeys, selectedRows } = this.state;
        let { rowKey } = this.options
        let idx = selectedRowKeys.findIndex(v => v === record[rowKey]);
        if (this.options.singleSelect) {
          selectedRowKeys = [record[rowKey]];
          selectedRows = [record];
        } else {
          if (idx > -1) {
            selectedRowKeys.splice(idx, 1);
            let idx1 = selectedRows.findIndex(v => v[rowKey] === record[rowKey]);
            selectedRows.splice(idx1, 1);
          } else {
            selectedRowKeys.push(record[rowKey]);
            selectedRows.push(record);
          }
        }
        this.setState({
          selectedRowKeys,
          selectedRows
        });
      }
      handleReset = () => {
        this.props.form.resetFields();
        this.props.clearSearchParam();
      }
      handleSubmit = (e) => {
        e.preventDefault();
        let values = this.props.form.getFieldsValue();
        this.getPageData(1, values);
      }
      goDetail(view) {
        const { selectedRowKeys } = this.state;
        if (!selectedRowKeys) {
          showWarnMsg('请选择记录');
        } else if (!this.options.singleSelect && selectedRowKeys.length > 1) {
          showWarnMsg('请选择一条记录');
        } else {
          this.props.history.push(`${this.props.location.pathname}/addedit?${view?'v=1&':''}code=${selectedRowKeys[0]}`);
        }
      }
      delete() {
        const { selectedRowKeys } = this.state;
        if (!selectedRowKeys) {
          showWarnMsg('请选择记录');
        } else if (!this.options.singleSelect && selectedRowKeys.length > 1) {
          showWarnMsg('请选择一条记录');
        } else {
          showDelConfirm({
            onOk: () => {
              let param = { code: selectedRowKeys[0] };
              this.options.beforeDelete && this.options.beforeDelete(param);
              this.props.doFetching();
              fetch(this.options.deleteCode, param).then(data => {
                showSucMsg('操作成功');
                this.getPageData();
              }).catch(this.props.cancelFetching);
            }
          });
        }
      }
      handleBtnClick = (url) => {
        const { btnEvent } = this.options;
        switch(url) {
          case 'add':
            btnEvent.add
              ? btnEvent.add()
              : this.props.history.push(`${this.props.location.pathname}/addedit`);
            break;
          case 'edit':
            btnEvent.edit
              ? btnEvent.edit(this.state.selectedRowKeys)
              : this.goDetail();
            break;
          case 'detail':
            btnEvent.detail
              ? btnEvent.detail(this.state.selectedRowKeys)
              : this.goDetail();
            break;
          case 'delete':
            btnEvent.detail
              ? btnEvent.delete(this.state.selectedRowKeys)
              : this.delete();
            break;
          default:
            btnEvent[url] && btnEvent[url](this.state.selectedRowKeys, this.state.selectedRows);
        }
        this.setState({ selectedRowKeys: [] });
      }
      handleTableChange = (pagination) => {
        this.getPageData(pagination.current);
      }
      buildList = (options) => {
        this.options = {
          ...this.options,
          ...options
        };
        if (this.first) {
          this.options.pageCode && this.getPageData();
          this.props.parentCode && this.getOwnerBtns();
        }
        const columns = [];
        const searchFields = [];
        this.options.fields.forEach(f => {
          f.search && searchFields.push(f);
          let obj = {
            title: f.title,
            dataIndex: f.field
          };
          if (f.type === 'datetime') {
            obj.render = dateTimeFormat;
          } else if (f.type === 'date') {
            obj.render = dateFormat;
          } else if (f.type === 'select') {
            if (f.key) {
              f.keyName = f.keyName || 'dkey';
              f.valueName = f.valueName || 'dvalue';
            }
            if (!f.data) {
              f.data = this.props.searchData[f.field];
              this.first && this.getSelectData(f);
            } else if (!this.props.searchData[f.field]) {
              this.props.setSearchData({ data: f.data, key: f.field });
            }
            obj.render = (value) => {
              if (value && f.data) {
                let item = f.data.find(v => v[f.keyName] === value);
                return item
                  ? f.valueName.push
                    ? f.valueName.map(v => item[v]).join(' ')
                    : item[f.valueName]
                  : '';
              }
              return '';
            }
          }
          if (f.formatter) {
            obj.render = f.formatter;
          }
          columns.push(obj);
        });
        this.first = false;
        this.columns = columns;
        return this.getPageComponent(searchFields);
      }
      // 获取select框的数据
      getSelectData(item) {
        if (item.key) {
          getDictList({ parentKey: item.key, bizType: item.keyCode }).then(data => {
            this.props.setSearchData({ data, key: item.field });
          }).catch(() => {});
        } else if (item.listCode) {
          let param = item.params || {};
          fetch(item.listCode, param).then(data => {
            this.props.setSearchData({ data, key: item.field });
          }).catch(() => {});
        }
      }
      getOwnerBtns() {
        getOwnerBtns(this.props.parentCode).then(data => {
          this.props.setBtnList(data);
        }).catch(() => {});
      }
      getPageData(current = this.props.pagination.current, searchParam) {
        if (searchParam) {
          this.props.setSearchParam(searchParam);
        } else {
          searchParam = this.props.searchParam;
        }
        this.props.doFetching();
        const { pagination } = this.props;
        fetch(this.options.pageCode, {
          start: current,
          limit: pagination.pageSize,
          ...searchParam,
          ...this.options.searchParams
        }).then(data => {
          this.props.cancelFetching();
          this.props.setTableData(data.list);
          this.props.setPagination({
            ...pagination,
            current,
            total: data.totalCount
          });
        }).catch(this.props.cancelFetching);
      }
      getPageComponent(searchFields) {
        const rowSelection = {
          selectedRowKeys: this.state.selectedRowKeys,
          onChange: this.onSelectChange,
          type: this.options.singleSelect ? 'radio' : 'checkbox'
        };
        return (
          <div>
            {searchFields.length ? (
              <Form className="search-form" layout="inline" onSubmit={this.handleSubmit}>
                {this.getSearchFields(searchFields)}
              </Form>
            ) : null}
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
                rowKey={record => record[this.options.rowKey]}
                dataSource={this.props.tableList}
                pagination={this.props.pagination}
                loading={this.props.fetching}
                onChange={this.handleTableChange}
                onRowClick={this.handleRowClick}
              />
            </div>
          </div>
        );
      }
      getSearchFields(fields) {
        const { getFieldDecorator } = this.props.form;
        const children = [];
        fields.forEach(v => {
          children.push(
            <FormItem key={v.field} label={v.title}>
              {getFieldDecorator(`${v.field}`, { initialValue: this.props.searchParam[v.field] })(
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
