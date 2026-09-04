import React from 'react';
import { LuLoaderCircle } from './icons';
import styles from './Spinner.module.css';

/**
 * Indicador de progresso circular acessível.
 * Use quando um esqueleto não comunicar melhor o carregamento.
 */
const Spinner = ({ size = 20, label = 'Carregando', className = '' }) => (
  <span
    role="status"
    aria-live="polite"
    className={`${styles.spinner} ${className}`}
  >
    <LuLoaderCircle size={size} aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </span>
);

export default Spinner;
