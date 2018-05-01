import fetch from 'common/js/fetch';

export function setRoleMenus(menuCodeList, roleCode) {
  return fetch(627060, { menuCodeList, roleCode });
}
