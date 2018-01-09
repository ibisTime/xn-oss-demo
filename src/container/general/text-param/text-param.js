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
} from '@redux/general/text-param';
import { listWrapper } from 'common/js/build-list';

@listWrapper(
  state => ({
    ...state.generalTextParam,
    parentCode: state.menu.subMenuCode
  }),
  { setTableData, clearSearchParam, doFetching, setBtnList,
    cancelFetching, setPagination, setSearchParam, setSearchData }
)
class TextParam extends React.Component {
  render() {
    const fields = [{
      field: 'remark',
      title: '参数说明'
    }, {
      field: 'cvalue',
      title: '参数值',
      formatter: (e, t) => {
        return t.type === 'richText'
          ? <div dangerouslySetInnerHTML={{__html: e}}></div>
          : "VALID_TIME" === t.ckey
              ? t.cvalue + "分钟"
              : "weixinID" === t.ckey ? JSON.parse(t.cvalue).id : t.cvalue;
      }
    }];
    return this.props.buildList({
      fields,
      pageCode: 805915,
      rowKey: 'id',
      searchParams: {
        type: 'text'
      }
    });
  }
}

export default TextParam;
