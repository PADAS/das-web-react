import { toast } from 'react-toastify';

import { DEFAULT_TOAST_CONFIG } from '../constants';

export default (content, config = {}) => toast(content, {
  ...DEFAULT_TOAST_CONFIG, ...config,
});