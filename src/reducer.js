import { combineReducers } from 'redux';
import { user } from './redux/user';
import { menu } from './redux/menu';
import { securityRole } from './redux/security/role';
import { securityRoleAddEdit } from './redux/security/role-addedit';
import { securityMenu } from './redux/security/menu';
import { securityMenuAddEdit } from './redux/security/menu-addedit';
import { publicBanner } from './redux/public/banner';
import { publicBannerAddEdit } from './redux/public/banner-addedit';
import { generalTextParam } from './redux/general/text-param';
import { generalTextParamAddEdit } from './redux/general/text-param-addedit';
import { financeAccount } from './redux/finance/account';
import { financeLedger } from './redux/finance/ledger';
import { financeLedgerAddEdit } from '@redux/finance/ledger-addedit';
import { financePlatformLedger } from '@redux/finance/platform-ledger';
import { financeDistAddr } from '@redux/finance/dist-addr';

export default combineReducers({
  user,
  menu,
  securityRole,
  securityRoleAddEdit,
  securityMenu,
  securityMenuAddEdit,
  publicBanner,
  publicBannerAddEdit,
  generalTextParam,
  generalTextParamAddEdit,
  financeAccount,
  financeLedger,
  financeLedgerAddEdit,
  financePlatformLedger,
  financeDistAddr
});
