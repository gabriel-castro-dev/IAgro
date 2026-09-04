import React, { useId, useState } from 'react';
import { LuEye, LuEyeOff, LuTriangleAlert } from './icons';
import styles from './field.module.css';

/**
 * Campo de senha com botão mostrar/ocultar, label persistente e erro por ARIA.
 */
const PasswordField = React.forwardRef(function PasswordField(
  { label, id, error, hint, required = false, className = '', ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={`${styles.field} ${error ? styles.invalid : ''} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <div className={`${styles.control} ${styles.hasTrailing}`}>
        <input
          ref={ref}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
          {...rest}
        />
        <button
          type="button"
          className={styles.trailingBtn}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <LuEyeOff size={20} /> : <LuEye size={20} />}
        </button>
      </div>
      {hint && !error && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          <LuTriangleAlert size={15} aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  );
});

export default PasswordField;
