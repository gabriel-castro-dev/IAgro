import React from 'react';
import styles from './Brand.module.css';

/**
 * Marca IAgro: símbolo (broto sobre sulcos) + logotipo.
 * tone: 'dark' (sobre fundo claro) | 'light' (sobre fundo escuro/foto).
 */
const SIZES = {
  sm: { mark: 24, text: 18 },
  md: { mark: 34, text: 26 },
  lg: { mark: 48, text: 40 },
};

const BrandMark = ({ size = 34 }) => (
  <svg
    className={styles.mark}
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    aria-hidden="true"
  >
    {/* broto: duas folhas */}
    <path
      d="M20 20c0-5.2-3.4-9.2-8.8-9.8C10.6 15.4 14 19.6 20 20Z"
      className={styles.leaf}
    />
    <path
      d="M20 20c0-5.2 3.4-9.2 8.8-9.8C29.4 15.4 26 19.6 20 20Z"
      className={styles.leafAlt}
    />
    <path d="M20 20v8" className={styles.stem} strokeWidth="2.5" strokeLinecap="round" />
    {/* sulcos do campo */}
    <path d="M9 26c4.4 3.2 17.6 3.2 22 0" className={styles.row} strokeWidth="2" strokeLinecap="round" />
    <path d="M11 31c3.4 2.4 14.6 2.4 18 0" className={styles.row} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Brand = ({ tone = 'dark', size = 'md', showText = true, className = '' }) => {
  const s = SIZES[size] || SIZES.md;
  return (
    <span className={`${styles.brand} ${styles[tone]} ${className}`}>
      <BrandMark size={s.mark} />
      {showText && (
        <span className={styles.word} style={{ fontSize: s.text }}>
          IAgro
        </span>
      )}
    </span>
  );
};

export default Brand;
