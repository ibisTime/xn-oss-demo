import React from 'react';
import {
  setTableData,
  setPagination,
  setBtnList,
  setSearchParam,
  clearSearchParam,
  doFetching,
  cancelFetching,
  setSearchData
} from '@redux/finance/platform-ledger';
import { listWrapper } from 'common/js/build-list';
import { getQueryString, getUserId, dateTimeFormat } from 'common/js/util';

@listWrapper(
  state => ({
    ...state.financePlatformLedger,
    parentCode: state.menu.subMenuCode
  }),
  { setTableData, clearSearchParam, doFetching, setBtnList,
    cancelFetching, setPagination, setSearchParam, setSearchData }
)
class PlatformLedger extends React.Component {
  render() {
    const fields = [{
      title: '户名',
      field: 'realName',
      search: true
    }, {
      title: '币种',
      field: 'currency',
      type: 'select',
      key: 'coin'
    }, {
      title: '渠道',
      field: 'channelType',
      type: 'select',
      key: 'channel_type',
      search: true
    }, {
      title: '业务类型',
      field: 'bizType',
      type: 'select',
      key: 'biz_type',
      search: true
    }, {
      title: '变动金额',
      field: 'transAmount',
      amount: true
    }, {
      title: '变动前金额',
      field: 'preAmount',
      amount: true
    }, {
      title: '变动后金额',
      field: 'postAmount',
      amount: true
    }, {
      title: '状态',
      field: 'status',
      type: 'select',
      key: 'jour_status',
      search: true
    }, {
      title: '创建时间',
      field: 'createDatetime',
      type: 'date',
      rangedate: ['createDatetimeStart', 'createDatetimeEnd'],
      render: dateTimeFormat,
      search: true
    }];
    return this.props.buildList({
      fields,
      pageCode: 802520,
      searchParams: {
        type: 'P',
        kind: 0
      }
    });
  }
}

export default PlatformLedger;
