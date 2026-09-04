import React from 'react';
import Brand from '../ui/Brand';
import {
  LuHouse,
  LuFileText,
  LuChartColumn,
  LuHistory,
  LuUser,
  LuBell,
  LuLogOut,
  LuWarehouse,
  LuChevronRight,
} from '../ui/icons';
import styles from './AppShell.module.css';

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Visão geral', icon: LuHouse },
  { key: 'meus-dados', label: 'Registros', icon: LuFileText },
  { key: 'analises', label: 'Análises', icon: LuChartColumn },
  { key: 'historico', label: 'Histórico', icon: LuHistory },
  { key: 'perfil', label: 'Perfil', icon: LuUser },
];

function initials(name) {
  if (!name) return 'IA';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'IA';
}

const AppShell = ({
  activePage,
  onNavigate,
  userName = '',
  userRole = '',
  propertyName = '',
  theme = 'light',
  onLogout,
  children,
}) => {
  const activeLabel =
    NAV_ITEMS.find((i) => i.key === activePage)?.label || 'Visão geral';
  const property = propertyName || 'Minha propriedade';

  return (
    <div className={styles.shell} data-theme={theme}>
      {/* Sidebar (desktop / tablet) */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Brand tone="light" size="sm" className={styles.brandFull} />
          <Brand tone="light" size="md" showText={false} className={styles.brandMark} />
        </div>

        <nav className={styles.nav} aria-label="Navegação principal">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = activePage === key;
            return (
              <button
                key={key}
                type="button"
                className={`${styles.navItem} ${active ? styles.navActive : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(key)}
              >
                <span className={styles.navIcon}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className={styles.navLabel}>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userChip}>
            <span className={styles.avatar} aria-hidden="true">
              {initials(userName)}
            </span>
            <span className={styles.userMeta}>
              <span className={styles.userName}>{userName || 'Usuário'}</span>
              {userRole && <span className={styles.userRole}>{userRole}</span>}
            </span>
          </div>
          <button
            type="button"
            className={styles.logout}
            onClick={onLogout}
            aria-label="Sair da conta"
          >
            <LuLogOut size={20} aria-hidden="true" />
            <span className={styles.navLabel}>Sair</span>
          </button>
        </div>
      </aside>

      {/* Coluna principal */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumb}>
            <button
              type="button"
              className={styles.crumbHome}
              onClick={() => onNavigate('dashboard')}
              aria-label="Início"
            >
              <LuHouse size={18} aria-hidden="true" />
            </button>
            <LuChevronRight size={16} className={styles.crumbSep} aria-hidden="true" />
            <span className={styles.crumbCurrent}>{activeLabel}</span>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.property} title={property}>
              <LuWarehouse size={18} aria-hidden="true" />
              <span className={styles.propertyName}>{property}</span>
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Notificações"
              onClick={() => onNavigate('perfil')}
            >
              <LuBell size={20} aria-hidden="true" />
            </button>
            <span className={styles.avatar} aria-hidden="true">
              {initials(userName)}
            </span>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>

      {/* Navegação inferior (mobile) */}
      <nav className={styles.bottomNav} aria-label="Navegação">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activePage === key;
          return (
            <button
              key={key}
              type="button"
              className={`${styles.bottomItem} ${active ? styles.bottomActive : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(key)}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AppShell;
