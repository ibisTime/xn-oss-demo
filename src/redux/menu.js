import { getRoleMenuList } from 'api/menu';
import { getRealUrl } from 'common/js/util';
import { ROOT_MENU_CODE } from 'common/js/config';

const SET_TOP_MENU_CODE = 'SET_TOP_MENU_CODE';
const SET_SUB_MENU_CODE = 'SET_SUB_MENU_CODE';
const SET_SUB_OPEN_CODE = 'SET_SUB_OPEN_CODE';
const SET_MENU_LIST = 'SET_MENU_LIST';

const initState = {
  redirectTo: '',
  msg: '',
  menus: {},
  top2SubObj: {},
  topMenuList: [],
  subMenuList: [],
  topMenuCode: '',
  subMenuCode: '',
  subOpenCode: []
};

export function menu(state = initState, action) {
  switch(action.type) {
    case SET_TOP_MENU_CODE:
      return {...state, topMenuCode: action.payload, ...getSubCode(action.payload, state)};
    case SET_SUB_MENU_CODE:
      return {...state, subMenuCode: action.payload};
    case SET_SUB_OPEN_CODE:
      return {...state, subOpenCode: getSubOpenCode(action.payload, state)};
    case SET_MENU_LIST:
      return {...state, ..._getMenuState(action.payload)};
    default:
      return state;
  }
}

export function setTopCode(code) {
  return { type: SET_TOP_MENU_CODE, payload: code };
}

export function setSubMenuCode(code) {
  return { type: SET_SUB_MENU_CODE, payload: code };
}

export function setSubOpenCode(code) {
  return { type: SET_SUB_OPEN_CODE, payload: code };
}

function setMenuList(data) {
  return { type: SET_MENU_LIST, payload: data };
}

// 获取菜单列表
export function getMenuList(pathname) {
  return dispatch => {
    getRoleMenuList().then(data => {
      dispatch(setMenuList({ data, pathname }));
    }).catch(() => {});
  };
}

function _getMenuState({ data, pathname }) {
  let result = {
    topMenuList: [],
    topMenuCode: '',
    subMenuList: [],
    subMenuCode: '',
    subOpenCode: [],
    top2SubObj: {},
    menus: {}
  };
  let newList = getFilterList(result, data);
  createMenus(newList, result);
  sortSubMenus(result);
  if (pathname !== '/') {
    var pathArr = pathname.split('/').filter(v => v);
    let realPath = pathArr.slice(0, 2).join('/');
    realPath = '/' + realPath + '.htm';
    let menu = Object.values(result.menus).find(v => v.url === realPath);
    if (menu) {
      result.subMenuCode = menu.code;
      result.subOpenCode = [menu.parentCode];
      if (result.top2SubObj[result.subOpenCode]) {
        result.topMenuCode = menu.parentCode;
      } else {
        result.topMenuCode = result.menus[menu.parentCode].parentCode;
      }
      result.subMenuList = result.top2SubObj[result.topMenuCode];
      if (!result.subMenuCode) {
        result.subMenuCode = result.subMenuList[0].children
          ? result.subMenuList[0].children[0].code
          : result.subMenuList[0].code;
      }
      if (!result.subOpenCode.length) {
        result.subOpenCode = [result.subMenuList[0].code];
      }
    } else {
      result.redirectTo = '/';
    }
  }
  return result;
}

function getFilterList(result, data) {
  let newList = [];
  data.forEach(v => {
    if (v.parentCode) {
      result.menus[v.code] = v;
      if (v.parentCode === ROOT_MENU_CODE) {
        result.topMenuList.push(v);
        result.top2SubObj[v.code] = [];
      } else {
        newList.push(v);
      }
    }
  });
  return newList;
}

function createMenus(newList, result) {
  newList.forEach(v => {
    v.url = getRealUrl(v.url);
    let pCode = v.parentCode;
    if (result.top2SubObj[pCode]) {
      if (!result.top2SubObj[pCode].find(i => i.code === v.code)) {
        result.top2SubObj[pCode].push(v);
      }
    } else {
      let pList = result.top2SubObj[result.menus[pCode].parentCode];
      let pIdx = pList.findIndex(v => v.code === pCode);
      if (pIdx > -1) {
        pList[pIdx].children = pList[pIdx].children || [];
      } else {
        result.menus[pCode].children = [];
        pList.push(result.menus[pCode]);
        pIdx = pList.length - 1;
      }
      pList[pIdx].children.push(v);
    }
  });
}

function sortSubMenus(result) {
  for (let key in result.top2SubObj) {
    result.top2SubObj[key].sort((a, b) => +a.orderNo > +b.orderNo);
  }
}

function getSubCode(code, state) {
  return {
    subOpenCode: [state.top2SubObj[code][0].code],
    subMenuCode: state.top2SubObj[code][0].children ? state.top2SubObj[code][0].children[0].code : state.top2SubObj[code][0].code,
    subMenuList: state.top2SubObj[code]
  };
}

function getSubOpenCode(code, state) {
  let list = state.subOpenCode.slice();
  let idx = list.findIndex(v => v === code);
  if (idx > -1) {
    list.splice(idx);
  } else {
    list.push(code);
  }
  return list;
}
