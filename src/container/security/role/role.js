import React from 'react';
import { getInitData, getPageTableData, clearSearchParam } from '@redux/security.role';
import { listWrapper } from 'common/js/build-list';

@listWrapper(
  state => ({
    ...state.securityRole,
    parentCode: state.menu.subMenuCode
  }),
  { getInitData, getPageTableData, clearSearchParam }
)
class Role extends React.Component {
  componentDidMount() {
    this.props.getInitData(this.props.parentCode);
  }
  render() {
    const fields = [{
      title: '角色名称',
      field: 'name',
      search: true
    }, {
      title: '角色等级',
      field: 'level',
      formatter: (level) => {
        if (level && this.props.searchData['role_level']) {
          let item = this.props.searchData['role_level'].find(v => v.dkey === level);
          return item ? item.dvalue : '';
        }
        return '';
      },
      type: 'select',
      data: this.props.searchData['role_level'],
      keyName: 'dkey',
      valueName: 'dvalue',
      search: true
    }, {
      title: '更新人',
      field: 'updater'
    }, {
      title: '更新时间',
      field: 'updateDatetime',
      type: 'datetime'
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

export default Role;
