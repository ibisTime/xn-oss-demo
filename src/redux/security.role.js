import { getDictList, getOwnerBtns, getPageRoles } from 'api/general';

const PREFIX = 'SECURITY_ROLE_';
const SET_BUTTON_LIST = PREFIX + 'SET_BUTTON_LIST';
const ERROR_MSG = PREFIX + 'ERROR_MSG';
const LOADING = PREFIX + 'LOADING';
const CANCEL_LOADING = PREFIX + 'CANCEL_LOADING';
const SET_TABLE_DATA = PREFIX + 'SET_TABLE_DATA';
const SET_SEARCH_DATA = PREFIX + 'SET_SEARCH_DATA';
const SET_PAGINATION = PREFIX + 'SET_PAGINATION';
const SET_SEARCH_PARAM = PREFIX + 'SET_SEARCH_PARAM';

const initState = {
  fetching: false,
  msg: '',
  btnList: [],
  tableList: [],
  searchParam: {},
  searchData: {},
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0
  }
}

export function securityRole(state = initState, action) {
  switch(action.type) {
    case SET_BUTTON_LIST:
      return {...state, btnList: action.payload};
    case SET_TABLE_DATA:
      return {...state, msg: '', tableList: action.payload};
    case SET_SEARCH_DATA:
      return {...state, searchData: {...state.searchData, [action.payload.key]: action.payload.data}};
    case SET_PAGINATION:
      return {...state, pagination: action.payload};
    case SET_SEARCH_PARAM:
      return {...state, searchParam: action.payload};
    case LOADING:
      return {...state, fetching: true};
    case CANCEL_LOADING:
      return {...state, fetching: false};
    case ERROR_MSG:
      return {...state, msg: action.msg};
    default:
      return state;
  }
}

function setBtnList(data) {
  return { type: SET_BUTTON_LIST, payload: data };
}

function fetching() {
  return { type: LOADING };
}

function cancelFetching() {
  return { type: CANCEL_LOADING };
}

function setTableData(data) {
  return { type: SET_TABLE_DATA, payload: data };
}

function setSearchData(data) {
  return { type: SET_SEARCH_DATA, payload: data };
}

function setPagination(data) {
  return { type: SET_PAGINATION, payload: data };
}

function setSearchParam(data) {
  return { type: SET_SEARCH_PARAM, payload: data };
}

export function clearSearchParam() {
  return setSearchParam([]);
}

function errorMsg (msg) {
  return { msg, type: ERROR_MSG };
}

export function getInitData(parentCode) {
  return (dispatch, getState) => {
    dispatch(fetching());
    let pagination = getState().securityRole.pagination;
    let { current, pageSize } = pagination;
    Promise.all([
      getOwnerBtns(parentCode),
      getPageRoles({
        current,
        pageSize,
        ...getState().securityRole.searchParam
      }),
      getDictList('role_level')
    ]).then(([btnData, tableData, dictData]) => {
      dispatch(cancelFetching());
      dispatch(setBtnList(btnData));
      dispatch(setTableData(tableData.list));
      dispatch(setPagination({
        ...pagination,
        total: tableData.totalCount
      }));
      dispatch(setSearchData({ data: dictData, key: 'role_level' }));
    }).catch(msg => {
      dispatch(cancelFetching());
      msg = typeof msg === 'string' ? msg : '网络异常，请重新操作!';
      dispatch(errorMsg(msg));
    });
  };
}

export function getPageTableData(current, searchParam) {
  return (dispatch, getState) => {
    dispatch(fetching());
    let pagination = getState().securityRole.pagination;
    let { pageSize } = pagination;
    if (searchParam) {
      dispatch(setSearchParam(searchParam));
    } else {
      searchParam = getState().securityRole.searchParam;
    }
    getPageRoles({
      current,
      pageSize,
      ...searchParam
    }).then(data => {
      dispatch(cancelFetching());
      dispatch(setTableData(data.list));
      dispatch(setPagination({
        ...pagination,
        current,
        total: data.totalCount
      }));
    }).catch(msg => {
      dispatch(cancelFetching());
      msg = typeof msg === 'string' ? msg : '网络异常，请重新操作!';
      dispatch(errorMsg(msg));
    });
  }
}
