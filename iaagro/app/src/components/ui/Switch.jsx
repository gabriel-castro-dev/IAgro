import React, { useId } from 'react';
import styles from './Switch.module.css';

/**
 * Switch acessível (checkbox estilizado). `label` e `description` opcionais.
 */
const Switch = ({ checked, onChange, label, description, id, ...rest }) => {
  const autoId = useId();
  const sid = id || autoId;
  return (
    <label className={styles.wrap} htmlFor={sid}>
      {(label || description) && (
        <span className={styles.text}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.desc}>{description}</span>}
        </span>
      )}
      <span className={styles.control}>
        <input
          id={sid}
          type="checkbox"
          role="switch"
          checked={!!checked}
          onChange={onChange}
          className={styles.input}
          {...rest}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </span>
    </label>
  );
};

export default Switch;
