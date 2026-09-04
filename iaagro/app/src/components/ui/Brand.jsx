import React from 'react';
import styles from './Brand.module.css';

/**
 * Marca IAgro usando os assets oficiais em /assets/brand.
 * tone: 'dark' (logotipo escuro, sobre fundo claro) | 'light' (sobre fundo escuro/foto).
 * showText=false usa apenas o símbolo.
 */
const LOCKUP_HEIGHT = { sm: 30, md: 40, lg: 52 };
const MARK_HEIGHT = { sm: 26, md: 34, lg: 46 };

const Brand = ({ tone = 'dark', size = 'md', showText = true, className = '' }) => {
  const height = showText ? LOCKUP_HEIGHT[size] || 40 : MARK_HEIGHT[size] || 34;
  const src = showText
    ? tone === 'light'
      ? '/assets/brand/logo-horizontal-light.svg'
      : '/assets/brand/logo-horizontal-dark.svg'
    : '/assets/brand/logo-mark.svg';

  return (
    <img
      src={src}
      alt="IAgro"
      height={height}
      style={{ height, width: 'auto' }}
      className={`${styles.brand} ${className}`}
      draggable="false"
    />
  );
};

export default Brand;
