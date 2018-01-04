import fetch from 'common/js/fetch';
import { getRoleCode } from 'common/js/util';

/**
 * 获取数据字典列表
 * @param parentKey
 */
export function getDictList(parentKey) {
  if (getDictList[parentKey]) {
    return Promise.resolve(getDictList[parentKey]);
  }
  // 805906
  return fetch(625907, { parentKey }).then(data => {
    getDictList[parentKey] = data;
    return data;
  });
}

/**
 * 获取当前菜单拥有的按钮列表
 * @param parentKey
 */
export function getOwnerBtns(parentCode) {
  return fetch(805026, {
    parentCode,
    roleCode: getRoleCode(),
    type: 2
  });
}

/**
 * 列表获取菜单
 */
export function getMenuList() {
  return fetch(805001, {
    type: 1
  });
}

/**
 * 分页获取菜单和按钮
 * @param start
 * @param limit
 * @param {object} param
 */
export function getPageMenus({ current: start, pageSize: limit, ...param }) {
  return fetch(805000, {
    start,
    limit,
    ...param
  });
}

/**
 * 分页获取角色
 * @param start
 * @param limit
 * @param {object} param
 */
export function getPageRoles({ current: start, pageSize: limit, ...param }) {
  return fetch(805020, {
    start,
    limit,
    ...param
  });
}
