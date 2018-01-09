import React from 'react';
import {
  initStates,
  doFetching,
  cancelFetching,
  setSelectData,
  setPageData,
  restore
} from '@redux/general/text-param-addedit';
import { getQueryString } from 'common/js/util';
import { DetailWrapper } from 'common/js/build-detail';

@DetailWrapper(
  state => state.generalTextParamAddEdit,
  { initStates, doFetching, cancelFetching, setSelectData, setPageData, restore }
)
class TextParamAddEdit extends React.Component {
  constructor(props) {
    super(props);
    this.code = getQueryString('code', this.props.location.search);
    this.view = !!getQueryString('v', this.props.location.search);
  }
  render() {
    const fields = [{
      title: '参数说明',
      field: 'remark',
      readonly: true
    }, {
      title: '参数值',
      field: 'cvalue',
      type: 'textarea',
      // normalArea: true,
      required: true
    }];
    return this.props.buildDetail({
      fields,
      code: this.code,
      view: this.view,
      beforeDetail: (param) => {
        param.id = this.code;
      },
      beforeSubmit: (param) => {
        param.id = this.code;
        param.remark = this.props.pageData['remark'];
        return param;
      },
      detailCode: 805916,
      addCode: 805910,
      editCode: 805911
    });
  }
}

export default TextParamAddEdit;
