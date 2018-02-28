import React from 'react';
import {
  initStates,
  doFetching,
  cancelFetching,
  setSelectData,
  setPageData,
  restore
} from '@redux/public/aboutus-addedit';
import { showSucMsg } from 'common/js/util';
import { DetailWrapper } from 'common/js/build-detail';
import { COMPANY_CODE } from 'common/js/config';
import fetch from 'common/js/fetch';

@DetailWrapper(
  state => state.publicAboutusAddEdit,
  { initStates, doFetching, cancelFetching, setSelectData, setPageData, restore }
)
class AboutusAddEdit extends React.Component {
  render() {
    const fields = [{
      field: 'remark',
      value: '关于我们',
      hidden: true
    }, {
      title: '角色名称',
      field: 'cvalue',
      type: 'textarea',
      required: true
    }];
    return this.props.buildDetail({
      fields,
      key: 'ckey',
      code: 'about_us',
      detailCode: 660917,
      buttons: [{
        title: '保存',
        check: true,
        handler: (params) => {
          this.props.doFetching();
          fetch(660911, params).then(() => {
            showSucMsg('操作成功');
            this.props.cancelFetching();
          }).catch(this.props.cancelFetching);
        }
      }]
    });
  }
}

export default AboutusAddEdit;
