import React from 'react';
import styles from './StatusTag.module.css';

/**
 * Etiqueta de status combinando cor + texto (nunca só cor).
 * tone: green | orange | blue | brass | rust | danger | neutral | success
 */
const StatusTag = ({ tone = 'neutral', dot = true, icon, children, className = '' }) => (
  <span className={`${styles.tag} ${styles[tone]} ${className}`}>
    {icon ? (
      <span className={styles.icon} aria-hidden="true">{icon}</span>
    ) : dot ? (
      <span className={styles.dot} aria-hidden="true" />
    ) : null}
    {children}
  </span>
);

export default StatusTag;
