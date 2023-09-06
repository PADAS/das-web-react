import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const ContextMenu = ({ children, className, disabled, options }) => {
  const areaRef = useRef();

  const [contextMenuPosition, setContextMenuPosition] = useState(null);

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();

    if (!disabled) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      setContextMenuPosition({ x, y, flipHorizontally: x > (bounds.width / 2) });
    }
  }, [disabled]);

  useEffect(() => {
    const onClick = () => setContextMenuPosition(null);

    const onContextMenu = (event) => {
      if (!areaRef?.current?.contains(event.target)){
        setContextMenuPosition(null);
      }
    };

    window.addEventListener('click', onClick);
    window.addEventListener('contextmenu', onContextMenu);

    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  return <div
      className={`${styles.menuArea} ${className}`}
      data-testid="contextMenu"
      onContextMenu={handleContextMenu}
      ref={areaRef}
    >
    <div
      className={`${styles.menuPositionReference} ${!contextMenuPosition ? styles.hidden : ''}`}
      style={{
        left: `${contextMenuPosition?.x}px`,
        top: `${contextMenuPosition?.y}px`,
      }}
    >
      <Dropdown.Menu className={contextMenuPosition?.flipHorizontally ? styles.flipHorizontally : ''} show>
        {options}
      </Dropdown.Menu>
    </div>

    {children}
  </div>;
};

ContextMenu.defaultProps = {
  className: '',
  disabled: false,
};

ContextMenu.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  options: PropTypes.element.isRequired,
};

export default memo(ContextMenu);
