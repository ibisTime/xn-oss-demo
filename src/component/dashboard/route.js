import asyncComponent from '../async-component/async-component';

const ROUTES = [
  {
    path: '/security/role',
    component: asyncComponent(() => import('../../container/security/role/role'))
  },
  {
    path: '/security/menu',
    component: asyncComponent(() => import('../../container/security/menu/menu'))
  },
  {
    path: '/system/menu/addedit',
    component: asyncComponent(() => import('../../container/security/menu-addedit/menu-addedit'))
  },

  
  {
    path: '/system/role',
    component: asyncComponent(() => import('../../container/security/role/role'))
  },
  {
    path: '/system/menu',
    component: asyncComponent(() => import('../../container/security/menu/menu'))
  },
  {
    path: '/system/menu/addedit',
    component: asyncComponent(() => import('../../container/security/menu-addedit/menu-addedit'))
  }
]

export default ROUTES;
