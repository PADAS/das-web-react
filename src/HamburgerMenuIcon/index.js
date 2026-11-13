import * as styles from './styles.module.scss';

const HamburgerMenuIcon = ({ className = '', isOpen = false, ...otherProps }) => <button
  className={`${styles.hamburger} ${isOpen ? styles.open : ''} ${className}`}
  type="button"
  {...otherProps}
>
  <span aria-hidden="true" className={styles.lines} />
</button>;

export default HamburgerMenuIcon;
