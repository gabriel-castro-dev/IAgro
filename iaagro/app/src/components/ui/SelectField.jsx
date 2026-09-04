import React, { useId } from 'react';
import { LuChevronDown, LuTriangleAlert } from './icons';
import styles from './field.module.css';

/**
 * Select com label persistente e erro por ARIA. `options`: [{value, label}].
 */
const SelectField = React.forwardRef(function SelectField(
  { label, id, error, hint, required = false, options = [], placeholder, className = '', children, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${styles.field} ${error ? styles.invalid : ''} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <div className={styles.selectWrap}>
        <select
          ref={ref}
          id={fieldId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <LuChevronDown size={18} className={styles.selectChevron} aria-hidden="true" />
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

export default SelectField;
