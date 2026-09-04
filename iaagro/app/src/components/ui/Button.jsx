import React from 'react';
import Spinner from './Spinner';
import styles from './Button.module.css';

/**
 * Botão base. variants: primary | secondary | ghost | danger.
 * `as` permite renderizar como Link do router (ex.: as={Link} to="/").
 */
const Button = React.forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon = null,
    rightIcon = null,
    className = '',
    children,
    type,
    ...rest
  },
  ref
) {
  const isButton = Component === 'button';
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      ref={ref}
      className={cls}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={!isButton && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      type={isButton ? type || 'button' : undefined}
      {...rest}
    >
      {loading && <Spinner size={18} className={styles.spinner} />}
      {!loading && leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      <span className={styles.label}>{children}</span>
      {!loading && rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </Component>
  );
});

export default Button;
