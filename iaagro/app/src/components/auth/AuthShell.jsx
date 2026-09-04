import React from 'react';
import Brand from '../ui/Brand';
import styles from './AuthShell.module.css';

/**
 * Layout compartilhado das telas de autenticação.
 * Desktop: painel fotográfico à esquerda + formulário em fundo marfim à direita.
 * < 900px: painel some, logo compacto acima do formulário.
 *
 * props:
 *  - image: url da foto do painel
 *  - tagline: frase editorial sobre a foto
 *  - brandBottom: se true, marca+tagline ficam na base (login usa marca no topo)
 *  - children: conteúdo do formulário
 */
const AuthShell = ({ image, tagline, children }) => {
  return (
    <div className={styles.shell}>
      <aside
        className={styles.panel}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        <div className={styles.panelScrim} aria-hidden="true" />
        <div className={styles.panelContent}>
          <Brand tone="light" size="lg" />
          {tagline && <p className={styles.tagline}>{tagline}</p>}
        </div>
      </aside>

      <main className={styles.formArea}>
        <div className={styles.compactBrand}>
          <Brand tone="dark" size="sm" />
        </div>
        <div className={styles.formInner}>{children}</div>
      </main>
    </div>
  );
};

export default AuthShell;
