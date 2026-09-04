import React, { useId } from 'react';
import { LuTriangleAlert } from './icons';
import styles from './field.module.css';

/**
 * Campo de texto com label persistente, hint e erro ligado por ARIA.
 * `multiline` renderiza textarea.
 */
const TextField = React.forwardRef(function TextField(
  {
    label,
    id,
    error,
    hint,
    required = false,
    multiline = false,
    className = '',
    ...rest
  },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  const Control = multiline ? 'textarea' : 'input';

  return (
    <div className={`${styles.field} ${error ? styles.invalid : ''} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <div className={styles.control}>
        <Control
          ref={ref}
          id={fieldId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
          {...rest}
        />
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

export default TextField;
