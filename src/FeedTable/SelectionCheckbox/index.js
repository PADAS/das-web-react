import * as styles from './styles.module.scss';

const SelectionCheckbox = ({ isIndeterminate = false, ...otherProps }) => <label className={styles.selectionCheckbox}>
  <input
    className={styles.input}
    ref={(element) => {
      if (element) {
        element.indeterminate = isIndeterminate;
      }
    }}
    type="checkbox"
    {...otherProps}
  />
</label>;

export default SelectionCheckbox;
