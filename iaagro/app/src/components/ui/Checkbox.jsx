import React, { useId } from 'react';
import { LuCheck } from './icons';
import styles from './field.module.css';

/**
 * Checkbox acessível com label clicável. `children` é o rótulo (pode conter links).
 */
const Checkbox = React.forwardRef(function Checkbox(
  { id, children, className = '', ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <label className={`${styles.checkbox} ${className}`} htmlFor={fieldId}>
      <input ref={ref} id={fieldId} type="checkbox" {...rest} />
      <span className={styles.box} aria-hidden="true">
        <LuCheck size={14} strokeWidth={3} />
      </span>
      <span className={styles.checkboxText}>{children}</span>
    </label>
  );
});

export default Checkbox;
