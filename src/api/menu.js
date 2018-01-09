import fetch from 'common/js/fetch';
import { getRoleCode } from 'common/js/util';

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
 * 列表获取菜单和按钮
 */
export function getMenuBtnList() {
  return fetch(805001);
}

/**
 * 根据角色列表获取菜单
 */
export function getRoleMenuList() {
  return fetch(805026, {
    type: 1,
    roleCode: getRoleCode()
  })
}

/**
 * 根据角色列表获取菜单和按钮
 */
export function getRoleMenuBtnList(roleCode) {
  roleCode = roleCode || getRoleCode();
  return fetch(805026, { roleCode });
}
