import React from 'react';
import { LuTriangleAlert, LuCircleCheck, LuInfo } from './icons';
import styles from './InlineAlert.module.css';

const ICONS = {
  success: LuCircleCheck,
  error: LuTriangleAlert,
  info: LuInfo,
};

/**
 * Aviso inline combinando ícone + texto + cor (nunca só cor).
 * variant: success | error | info. Usa aria-live para leitores de tela.
 */
const InlineAlert = ({ variant = 'info', title, children, className = '' }) => {
  const Icon = ICONS[variant] || LuInfo;
  return (
    <div
      className={`${styles.alert} ${styles[variant]} ${className}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <Icon size={20} className={styles.icon} aria-hidden="true" />
      <div className={styles.body}>
        {title && <strong className={styles.title}>{title}</strong>}
        {children && <div className={styles.text}>{children}</div>}
      </div>
    </div>
  );
};

export default InlineAlert;
