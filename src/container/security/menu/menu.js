import React from 'react';
import { getInitData, getPageTableData, clearSearchParam } from '@redux/security.menu';
import { listWrapper } from 'common/js/build-list';

@listWrapper(
  state => ({
    ...state.securityMenu,
    parentCode: state.menu.subMenuCode
  }),
  { getInitData, getPageTableData, clearSearchParam }
)
class Menu extends React.Component {
  componentDidMount() {
    this.props.getInitData(this.props.parentCode);
  }
  render() {
    const fields = [{
      title: '菜单名称',
      field: 'name',
      search: true
    }, {
      title: '菜单url',
      field: 'url'
    }, {
      title: '父菜单编号',
      field: 'parentCode',
      formatter: (parentCode) => {
        if (parentCode && this.props.searchData['parentCode']) {
          let item = this.props.searchData['parentCode'].find(v => v.code === parentCode);
          return item ? `${parentCode} ${item.name}` : '';
        }
        return '';
      },
      type: 'select',
      data: this.props.searchData['parentCode'],
      keyName: 'code',
      valueName: ['code', 'name'],
      search: true
    }, {
      title: '类型',
      field: 'type',
      formatter: (type) => {
        if (this.props.searchData['type']) {
          let item = this.props.searchData['type'].find(v => v.dkey === type);
          return item ? item.dvalue : '';
        }
        return '';
      },
      type: 'select',
      data: this.props.searchData['type'],
      keyName: 'dkey',
      valueName: 'dvalue',
      search: true
    }, {
      title: '菜单顺序',
      field: 'orderNo'
    }, {
      title: '备注',
      field: 'remark'
    }];
    const btnEvent = {
      delete: () => {
        console.log('delete');
      }
    };
    return this.props.buildList({ fields, btnEvent });
  }
}

export default Menu;
