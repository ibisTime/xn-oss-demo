import fetch from 'common/js/fetch';
import { COMPANY_CODE } from 'common/js/config';

/**
 * 获取数据字典列表
 * @param parentKey
 * @param bizType
 */
export function getDictList({ parentKey, bizType = 630036 }) {
  if (getDictList[parentKey]) {
    return Promise.resolve(getDictList[parentKey]);
  }
  return fetch(bizType, {
    parentKey,
    companyCode: COMPANY_CODE
  }).then(data => {
    getDictList[parentKey] = data;
    return data;
  });
}