import { combineReducers } from 'redux';
import { user } from './redux/user';
import { menu } from './redux/menu';
import { securityRole } from './redux/security.role';
import { securityMenu } from './redux/security.menu';

export default combineReducers({ user, menu, securityRole, securityMenu });
