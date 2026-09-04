import React, { useMemo, useState } from 'react';
import { getAddressByCEP, applyCEPMask } from '../../services/addressService';
import { Button, TextField, SelectField, Switch, InlineAlert } from '../ui';
import {
  LuUser, LuHouse, LuBell, LuPlug, LuPalette, LuShield, LuLogOut,
  LuCircleCheck, LuTriangleAlert, LuSun, LuMoon, LuCrown, LuCalendar, LuClock,
} from 'react-icons/lu';
import styles from './Perfil.module.css';

const SECTIONS = [
  { key: 'dados', label: 'Dados pessoais', icon: LuUser },
  { key: 'propriedade', label: 'Propriedade', icon: LuHouse },
  { key: 'notificacoes', label: 'Notificações', icon: LuBell },
  { key: 'integracoes', label: 'Integrações', icon: LuPlug },
  { key: 'aparencia', label: 'Aparência', icon: LuPalette },
  { key: 'seguranca', label: 'Segurança', icon: LuShield },
];

const PROFISSOES = ['Agrônomo', 'Produtor rural', 'Técnico agrícola', 'Consultor', 'Outro'];
const EXPERIENCIAS = ['Menos de 1 ano', '1–3 anos', '3–10 anos', 'Mais de 10 anos'];
const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

function initials(name) {
  if (!name) return 'IA';
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || 'IA';
}

const Perfil = ({ profile = {}, onChange, onSave, theme = 'light', onThemeChange, email = '', onLogout }) => {
  const [section, setSection] = useState('dados');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // {type, msg}
  const [cepStatus, setCepStatus] = useState(null); // {type, msg}
  const [phoneError, setPhoneError] = useState('');

  const memberSince = useMemo(() => {
    const c = profile.criadoEm;
    if (c?.seconds) return new Date(c.seconds * 1000).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return '—';
  }, [profile.criadoEm]);

  const handleSave = async () => {
    if (profile.telefone && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(profile.telefone.replace(/\s/g, ''))) {
      setPhoneError('Telefone inválido. Use o formato (00) 00000-0000.');
      setSection('dados');
      return;
    }
    setPhoneError('');
    setSaving(true);
    setFeedback(null);
    const res = await onSave?.();
    setSaving(false);
    setFeedback(res?.success ? { type: 'success', msg: 'Alterações salvas.' } : { type: 'error', msg: res?.error || 'Não foi possível salvar.' });
  };

  const handleCepChange = async (value) => {
    const masked = applyCEPMask(value);
    onChange('cep', masked);
    setCepStatus(null);
    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      setCepStatus({ type: 'loading', msg: 'Buscando endereço…' });
      const r = await getAddressByCEP(clean);
      if (r.success) {
        onChange('endereco', r.data.endereco);
        onChange('cidade', r.data.cidade);
        onChange('estado', r.data.estado);
        setCepStatus({ type: 'success', msg: 'Endereço localizado' });
      } else {
        setCepStatus({ type: 'error', msg: r.error || 'CEP não encontrado' });
      }
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Perfil e configurações</h1>
          <p className={styles.subtitle}>Gerencie seus dados, propriedade e preferências.</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Salvar alterações</Button>
      </header>

      {feedback && (
        <InlineAlert variant={feedback.type}>{feedback.msg}</InlineAlert>
      )}

      <div className={styles.body}>
        {/* Subnav */}
        <nav className={styles.subnav} aria-label="Seções do perfil">
          <select className={styles.subnavSelect} value={section} onChange={(e) => setSection(e.target.value)} aria-label="Seção">
            {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <ul className={styles.subnavList}>
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button className={`${styles.subnavBtn} ${section === key ? styles.subnavActive : ''}`}
                  onClick={() => setSection(key)} aria-current={section === key ? 'true' : undefined}>
                  <Icon size={18} aria-hidden="true" /> {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Conteúdo */}
        <div className={styles.content}>
          {section === 'dados' && (
            <>
              <h2 className={styles.sectionTitle}>Dados pessoais</h2>
              <div className={styles.avatarRow}>
                <span className={styles.avatar} aria-hidden="true">{initials(profile.nomeCompleto || email)}</span>
                <Button variant="secondary" size="sm">Alterar foto</Button>
              </div>
              <div className={styles.grid2}>
                <TextField label="Nome completo" value={profile.nomeCompleto || ''} onChange={(e) => onChange('nomeCompleto', e.target.value)} className={styles.span2} />
                <div className={styles.span2}>
                  <TextField label="E-mail" value={email} readOnly disabled hint="O e-mail de acesso não pode ser alterado aqui." />
                  <span className={styles.verified}><LuCircleCheck size={15} /> Verificado</span>
                </div>
                <TextField label="Telefone" value={profile.telefone || ''} onChange={(e) => onChange('telefone', e.target.value)} placeholder="(31) 90000-0000" error={phoneError} />
                <SelectField label="Profissão" value={profile.profissao || ''} onChange={(e) => onChange('profissao', e.target.value)} placeholder="Selecione"
                  options={PROFISSOES.map((p) => ({ value: p, label: p }))} />
                <SelectField label="Experiência" value={profile.experienciaAgro || ''} onChange={(e) => onChange('experienciaAgro', e.target.value)} placeholder="Selecione"
                  options={EXPERIENCIAS.map((x) => ({ value: x, label: x }))} className={styles.span2} />
              </div>
            </>
          )}

          {section === 'propriedade' && (
            <>
              <h2 className={styles.sectionTitle}>Propriedade</h2>
              <div className={styles.grid2}>
                <TextField label="Nome da propriedade" value={profile.propriedadeRural || ''} onChange={(e) => onChange('propriedadeRural', e.target.value)} className={styles.span2} placeholder="Ex.: Fazenda Boa Vista" />
                <div>
                  <TextField label="CEP" value={profile.cep || ''} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" inputMode="numeric" />
                  {cepStatus && (
                    <span className={`${styles.cepStatus} ${styles[`cep_${cepStatus.type}`]}`}>
                      {cepStatus.type === 'success' && <LuCircleCheck size={15} />}
                      {cepStatus.type === 'error' && <LuTriangleAlert size={15} />}
                      {cepStatus.msg}
                    </span>
                  )}
                </div>
                <TextField label="Endereço" value={profile.endereco || ''} onChange={(e) => onChange('endereco', e.target.value)} />
                <TextField label="Cidade" value={profile.cidade || ''} onChange={(e) => onChange('cidade', e.target.value)} />
                <SelectField label="Estado" value={profile.estado || ''} onChange={(e) => onChange('estado', e.target.value)} placeholder="UF"
                  options={ESTADOS.map((u) => ({ value: u, label: u }))} />
                <TextField label="Culturas favoritas" value={profile.culturasFavoritas || ''} onChange={(e) => onChange('culturasFavoritas', e.target.value)} className={styles.span2} placeholder="Ex.: Soja, Milho" />
              </div>
            </>
          )}

          {section === 'notificacoes' && (
            <>
              <h2 className={styles.sectionTitle}>Notificações</h2>
              <div className={styles.switchList}>
                <Switch label="Lembretes por e-mail" description="Receber avisos de tarefas próximas do vencimento."
                  checked={profile.notificacoesEmail} onChange={(e) => onChange('notificacoesEmail', e.target.checked)} />
                <Switch label="Notificações push" description="Alertas no navegador (quando disponível)."
                  checked={profile.notificacoesPush} onChange={(e) => onChange('notificacoesPush', e.target.checked)} />
                <Switch label="Novidades e marketing" description="Comunicações ocasionais sobre o produto."
                  checked={profile.notificacoesMarketing} onChange={(e) => onChange('notificacoesMarketing', e.target.checked)} />
              </div>
            </>
          )}

          {section === 'integracoes' && (
            <>
              <h2 className={styles.sectionTitle}>Integrações</h2>
              <p className={styles.sectionHint}>Informe os perfis da propriedade nas redes. Os links são apenas exibidos — não há conexão automática.</p>
              <div className={styles.grid2}>
                <TextField label="Facebook" value={profile.redesSociais?.facebook || ''} onChange={(e) => onChange('redesSociais.facebook', e.target.value)} placeholder="URL ou usuário" />
                <TextField label="Instagram" value={profile.redesSociais?.instagram || ''} onChange={(e) => onChange('redesSociais.instagram', e.target.value)} placeholder="@usuario" />
                <TextField label="LinkedIn" value={profile.redesSociais?.linkedin || ''} onChange={(e) => onChange('redesSociais.linkedin', e.target.value)} placeholder="URL" />
                <TextField label="X / Twitter" value={profile.redesSociais?.twitter || ''} onChange={(e) => onChange('redesSociais.twitter', e.target.value)} placeholder="@usuario" />
              </div>
            </>
          )}

          {section === 'aparencia' && (
            <>
              <h2 className={styles.sectionTitle}>Aparência</h2>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Tema do sistema</span>
                <div className={styles.themeToggle} role="group" aria-label="Tema">
                  <button className={`${styles.themeBtn} ${theme === 'light' ? styles.themeOn : ''}`} onClick={() => onThemeChange('light')} aria-pressed={theme === 'light'}>
                    <LuSun size={18} /> Claro
                  </button>
                  <button className={`${styles.themeBtn} ${theme === 'dark' ? styles.themeOn : ''}`} onClick={() => onThemeChange('dark')} aria-pressed={theme === 'dark'}>
                    <LuMoon size={18} /> Escuro
                  </button>
                </div>
              </div>
              <div className={styles.grid2}>
                <SelectField label="Idioma" value={profile.idioma || 'Português'} onChange={(e) => onChange('idioma', e.target.value)}
                  options={[{ value: 'Português', label: 'Português' }, { value: 'Inglês', label: 'Inglês' }]} />
                <SelectField label="Unidade de medida" value={profile.unidadeMedida || 'Métrico'} onChange={(e) => onChange('unidadeMedida', e.target.value)}
                  options={[{ value: 'Métrico', label: 'Métrico' }, { value: 'Imperial', label: 'Imperial' }]} />
              </div>
            </>
          )}

          {section === 'seguranca' && (
            <>
              <h2 className={styles.sectionTitle}>Segurança</h2>
              <p className={styles.sectionHint}>Para alterar sua senha, use o fluxo "Esqueci minha senha" na tela de login. Um link seguro será enviado ao seu e-mail.</p>
              <div className={styles.dangerZone}>
                <div>
                  <strong>Sair da conta</strong>
                  <p>Encerra a sessão neste dispositivo.</p>
                </div>
                <Button variant="secondary" leftIcon={<LuLogOut size={18} />} onClick={onLogout}>Sair da conta</Button>
              </div>
            </>
          )}
        </div>

        {/* Resumo */}
        <aside className={styles.summary} aria-label="Resumo da conta">
          <h2 className={styles.summaryTitle}>Resumo da conta</h2>
          <SummaryRow icon={<LuCrown size={18} />} label="Plano" value="Essencial" />
          <SummaryRow icon={<LuCalendar size={18} />} label="Membro desde" value={memberSince} />
          <SummaryRow icon={<LuClock size={18} />} label="Último acesso" value="Agora" />
          <Button variant="secondary" leftIcon={<LuLogOut size={18} />} onClick={onLogout} className={styles.logoutBtn}>
            Sair da conta
          </Button>
        </aside>
      </div>
    </div>
  );
};

const SummaryRow = ({ icon, label, value }) => (
  <div className={styles.summaryRow}>
    <span className={styles.summaryIcon} aria-hidden="true">{icon}</span>
    <span className={styles.summaryMeta}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </span>
  </div>
);

export default Perfil;
