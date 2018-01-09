import fetch from 'common/js/fetch';
import { COMPANY_CODE } from 'common/js/config';

// 加载七牛token
export function getQiniuToken() {
  return fetch(805951, { companyCode: COMPANY_CODE });
}
