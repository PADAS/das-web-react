import MoonLoader from 'react-spinners/MoonLoader';

import useMenuToggle from '../../../../../hooks/useMenuToggle';

import Menu from '../../../../../Menu';

import * as styles from './styles.module.scss';

const EMPTY_OPTIONS = [];

const SAVE_LOADER_SIZE = 18;

const SaveSplitButton = ({
  className = '',
  isSaveDisabled = false,
  isSaving = false,
  label,
  menuLabel,
  onSave,
  options = EMPTY_OPTIONS,
}) => {
  const menuToggle = useMenuToggle({ isDisabled: isSaving });

  return <div
    className={`${styles.saveSplitButton} ${options.length > 0 ? styles.hasOptions : ''} ${className}`}
    role="group"
    >
    <button
      aria-busy={isSaving}
      className={styles.saveButton}
      disabled={isSaveDisabled || isSaving}
      onClick={onSave}
      type="button"
      >
      <span className={styles.saveButtonLabel}>{label}</span>

      {isSaving && <span className={styles.saveButtonLoader}>
        <MoonLoader aria-hidden color="var(--er-ui-text-primary-text-reversed)" size={SAVE_LOADER_SIZE} />
      </span>}
    </button>

    {options.length > 0 && <>
      <button
        aria-label={menuLabel}
        className={styles.toggle}
        disabled={isSaving}
        title={menuLabel}
        type="button"
        {...menuToggle.toggleProps}
      >
        <span aria-hidden="true" className={`${styles.caret} ${menuToggle.menuProps.show ? styles.open : ''}`} />
      </button>

      <Menu aria-label={menuLabel} className={styles.menu} placement="top-end" {...menuToggle.menuProps}>
        {options.map((option) => <Menu.Option key={option.key} onClick={option.onClick}>
          {option.label}
        </Menu.Option>)}
      </Menu>
    </>}
  </div>;
};

export default SaveSplitButton;
