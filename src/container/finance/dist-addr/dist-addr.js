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
} from '@redux/finance/dist-addr';
import { listWrapper } from 'common/js/build-list';
import { COMPANY_CODE } from 'common/js/config';

@listWrapper(
  state => ({
    ...state.financeDistAddr,
    parentCode: state.menu.subMenuCode
  }),
  { setTableData, clearSearchParam, doFetching, setBtnList,
    cancelFetching, setPagination, setSearchParam, setSearchData }
)
class DistAddr extends React.Component {
  render() {
    const fields = [{
      title: '地址',
      field: 'address',
      search: true
    }, {
      title: '拥有者',
      field: 'userId',
      type: 'select',
      pageCode: '805120',
      params: { kind: 'C', companyCode: COMPANY_CODE },
      keyName: 'userId',
      valueName: '{{mobile.DATA}}--{{nickname.DATA}}',
      searchName: 'mobile',
      formatter: (v, data) => {
        if (data.user) {
          return data.user.mobile + '(' + data.user.nickname + ')';
        }
      },
      search: true
    }, {
      title: '状态',
      field: 'status',
      type: 'select',
      key: true,
      data: [{
        dkey: '0',
        dvalue: '启用'
      }, {
        dkey: '2',
        dvalue: '弃用'
      }],
      search: true
    }, {
      title: '当前余额',
      field: 'balanceString',
      amount: true
    }];
    return this.props.buildList({
      fields,
      pageCode: 802105,
      searchParams: {
        type: 'X',
        companyCode: COMPANY_CODE
      }
    });
  }
}

export default DistAddr;
