import MoonLoader from 'react-spinners/MoonLoader';

import useMenuToggle from '../hooks/useMenuToggle';

import Menu from '../Menu';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 18;

const KebabMenu = ({
  align = 'start',
  'aria-label': ariaLabel,
  backgroundColor,
  children,
  className = '',
  defaultShow = false,
  dotColor,
  isLoading = false,
  size,
  title,
  ...otherProps
}) => {
  const menuToggle = useMenuToggle({ defaultShow, isDisabled: isLoading });

  return <div className={`${styles.kebabMenu} ${className}`} {...otherProps}>
    <button
      aria-busy={isLoading}
      aria-disabled={isLoading}
      aria-label={ariaLabel}
      className={styles.toggle}
      style={{
        '--kebab-menu-background-color': backgroundColor,
        '--kebab-menu-dot-color': dotColor,
        '--kebab-menu-size': size,
      }}
      title={title}
      type="button"
      {...menuToggle.toggleProps}
    >
      {isLoading
        ? <MoonLoader aria-hidden="true" color="currentColor" size={LOADER_SIZE} />
        : <span aria-hidden="true" className={styles.dots} />}
    </button>

    <Menu
      aria-label={ariaLabel}
      placement={align === 'end' ? 'bottom-end' : 'bottom-start'}
      {...menuToggle.menuProps}
    >
      {children}
    </Menu>
  </div>;
};

KebabMenu.Divider = Menu.Divider;
KebabMenu.Option = Menu.Option;

export default KebabMenu;
