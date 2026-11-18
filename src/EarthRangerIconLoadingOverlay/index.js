import EarthRangerLogo from '../EarthRangerLogo';

import * as styles from './styles.module.scss';

const EarthRangerIconLoadingOverlay = ({ message }) => <div className={styles.wrapper}>
  <EarthRangerLogo alt="" className={styles.logo} type="vertical" />

  {!!message && <p>{message}</p>}
</div>;

export default EarthRangerIconLoadingOverlay;
