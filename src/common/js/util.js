import cookies from 'browser-cookies';

/**
 * 保存用户登录信息
 * @param userId
 * @param token
 */
export function setUser({ userId, token }) {
  cookies.set('userId', userId);
  cookies.set('token', token);
}

// 删除用户登录信息
export function clearUser() {
  cookies.erase('userId');
  cookies.erase('token');
}

// 获取用户编号
export function getUserId() {
  return cookies.get('userId');
}

// 设置用户角色信息
export function setRoleInfo({ roleCode, kind, level, loginName }) {
  cookies.set('roleCode', roleCode);
  cookies.set('loginKind', kind);
  cookies.set('roleLevel', level);
  cookies.set('userName', loginName);
}

// 获取用户角色编号
export function getRoleCode() {
  return cookies.get('roleCode');
}

/**
 * 通过正则表达式获取URL传递参数
 * @param name
 * @returns
 */
export function getQueryString(name, search) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = search.substr(1).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    }
    return null;
}

/**
 * 日期格式转化
 * @param date
 * @param fmt
 */
export function formatDate(date, fmt = "yyyy-MM-dd") {
  if (date === '' || typeof(date) === 'undefined') {
    return '-';
  }
  date = new Date(date);
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  };
  for (let k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      let str = o[k] + '';
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? str : padLeftZero(str));
    }
  }
  return fmt;
}

function padLeftZero(str) {
  return ('00' + str).substr(str.length);
}

/**
 * 日期格式转化 yyyy-MM-dd
 * @param date
 * @param format
 */
export function dateFormat(date) {
    return formatDate(date, 'yyyy-MM-dd');
}

/**
 * 日期格式转化 yyyy-MM-dd hh:mm:ss
 * @param date
 * @param format
 */
export function dateTimeFormat(date) {
  return formatDate(date, 'yyyy-MM-dd hh:mm:ss');
}

/**
 * 金额格式转化
 * @param money
 * @param format
 */
export function moneyFormat(money, format) {
  var flag = true;
  if (isNaN(money)) {
    return '-';
  }
  if (money < 0) {
    money = -1 * money;
    flag = false;
  }
  if (format === '' || format === null || format === undefined || typeof format === 'object') {
    format = 2;
  }
  //钱除以1000并保留两位小数
  money = (money / 1000).toString();
  money = money.replace(/(\.\d\d)\d+/ig, "$1");
  money = parseFloat(money).toFixed(format);
  //千分位转化
  var re = /\d{1,3}(?=(\d{3})+$)/g;
  money = money.replace(/^(\d+)((\.\d+)?)$/, function(s, s1, s2) {
    return s1.replace(re, "$&,") + s2;
  });
  if (!flag) {
    money = "-" + money;
  }
  return money;
}
