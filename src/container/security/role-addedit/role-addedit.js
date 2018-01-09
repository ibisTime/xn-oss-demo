import React from 'react';
import {
  initStates,
  doFetching,
  cancelFetching,
  setSelectData,
  setPageData,
  restore
} from '@redux/security/role-addedit';
import { getQueryString } from 'common/js/util';
import { DetailWrapper } from 'common/js/build-detail';

@DetailWrapper(
  state => state.securityRoleAddEdit,
  { initStates, doFetching, cancelFetching, setSelectData, setPageData, restore }
)
class MenuAddEdit extends React.Component {
  constructor(props) {
    super(props);
    this.code = getQueryString('code', this.props.location.search);
    this.view = !!getQueryString('v', this.props.location.search);
  }
  render() {
    const fields = [{
      title: '角色名称',
      field: 'name',
      required: true
    }, {
      title: '角色等级',
      field: 'level',
      required: true,
      type: 'select',
      key: 'role_level',
      keyName: 'dkey',
      valueName: 'dvalue'
    }, {
      title: '备注',
      field: 'remark'
    }];
    return this.props.buildDetail({
      fields,
      beforeDetail: (param) => {
        param.kind = 1;
      },
      code: this.code,
      view: this.view,
      detailCode: 805022,
  		addCode: 805023,
  		editCode: 805025
    });
  }
}

export default MenuAddEdit;
