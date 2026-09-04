import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Checkbox, Brand } from '../ui';
import {
  LuFileText,
  LuLaptop,
  LuShieldCheck,
  LuLock,
  LuUser,
  LuMail,
  LuLeaf,
  LuX,
} from '../ui/icons';
import styles from './TermoDeUso.module.css';

const SECTIONS = [
  { id: 'visao-geral', label: 'Visão geral', icon: LuFileText },
  { id: 'uso-plataforma', label: 'Uso da plataforma', icon: LuLaptop },
  { id: 'dados-pessoais', label: 'Dados pessoais', icon: LuShieldCheck },
  { id: 'seguranca', label: 'Segurança', icon: LuLock },
  { id: 'seus-direitos', label: 'Seus direitos', icon: LuUser },
  { id: 'contato', label: 'Contato', icon: LuMail },
];

const CONTACT_EMAIL = 'iaagronotification@gmail.com';

const TermoDeUso = () => {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const sectionRefs = useRef({});

  // Progresso por rolagem vertical da página
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      setProgress(Math.min(Math.max(pct, 0), 100));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scrollspy: destaca a seção visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const goTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAccept = () => {
    if (!accepted) return;
    localStorage.setItem('termsAccepted', 'true');
    navigate('/cadastrar');
  };

  const handleDecline = () => navigate('/');

  const setRef = (id) => (el) => {
    sectionRefs.current[id] = el;
  };

  const lastUpdate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.breadcrumbGroup} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
          <Link to="/" className={styles.brandLink} aria-label="Início">
            <Brand tone="dark" size="sm" />
          </Link>
          <nav className={styles.breadcrumb} aria-label="Trilha">
            <Link to="/cadastrar">Criar conta</Link>
            <span className={styles.crumbSep} aria-hidden="true">/</span>
            <span className={styles.current} aria-current="page">Termos de Uso</span>
          </nav>
        </div>
        <button type="button" className={styles.closeBtn} onClick={handleDecline}>
          <LuX size={20} aria-hidden="true" />
          Fechar
        </button>
      </header>

      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.wrapper}>
        <aside className={styles.toc} aria-label="Sumário">
          <ul className={styles.tocList}>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`${styles.tocLink} ${activeId === s.id ? styles.active : ''}`}
                    aria-current={activeId === s.id ? 'true' : undefined}
                    onClick={() => goTo(s.id)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <label className={styles.tocSelect}>
            <span className="sr-only">Ir para a seção</span>
            <select
              value={activeId}
              onChange={(e) => goTo(e.target.value)}
              className={styles.tocSelectInput}
            >
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </aside>

        <article className={styles.doc}>
          <span className={styles.eyebrow}>Legal</span>
          <h1 className={styles.docTitle}>Termos de Uso e Privacidade</h1>
          <p className={styles.meta}>
            Última atualização: {lastUpdate} · Versão 2.0
          </p>

          <div className={styles.infoBand}>
            <LuLeaf size={22} aria-hidden="true" />
            Leia com atenção. Este documento explica como a plataforma funciona e
            como seus dados são tratados.
          </div>

          <section id="visao-geral" ref={setRef('visao-geral')} className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Visão geral</h2>
            <p>
              Este Termo de Uso ("Termo") é um acordo legal entre você, o(a)
              usuário(a) do sistema, e os desenvolvedores do Projeto{' '}
              <strong>IAgro</strong>, um sistema de gestão agronômica inteligente
              voltado para auxiliar agricultores de micro e médio porte no
              controle, análise e tomada de decisão sobre suas lavouras.
            </p>
            <p>
              Ao acessar ou utilizar o IAgro, você manifesta sua concordância
              integral com este Termo de Uso, com a Política de Privacidade e com a{' '}
              <strong>
                Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 –
                LGPD)
              </strong>
              . Se você não concordar com estes termos, não deverá utilizar o
              sistema.
            </p>
          </section>

          <section id="uso-plataforma" ref={setRef('uso-plataforma')} className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Uso da plataforma</h2>
            <p>O IAgro é destinado a facilitar a gestão agrícola por meio de:</p>
            <ul className={styles.list}>
              <li>Dashboards de análise e monitoramento;</li>
              <li>Alertas climáticos em tempo real;</li>
              <li>Relatórios personalizados de produtividade;</li>
              <li>Recomendações técnicas baseadas em Inteligência Artificial;</li>
              <li>Histórico agrícola completo.</li>
            </ul>

            <h3 className={styles.subTitle}>Vedações do uso</h3>
            <p>
              O usuário compromete-se a <strong>não utilizar</strong> o IAgro para
              qualquer finalidade ilícita, incluindo:
            </p>
            <ul className={styles.list}>
              <li>Envio de conteúdo ofensivo ou discriminatório;</li>
              <li>Invasão ou acesso não autorizado a contas;</li>
              <li>Violação de direitos de terceiros;</li>
              <li>Transmissão de malware ou código malicioso;</li>
              <li>Spam, phishing ou engenharia social;</li>
              <li>Atividades comerciais não autorizadas.</li>
            </ul>
          </section>

          <section id="dados-pessoais" ref={setRef('dados-pessoais')} className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Dados pessoais e LGPD</h2>
            <p>
              O usuário declara estar ciente da coleta e uso dos seguintes dados
              pelo IAgro:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Identificação:</strong> nome completo, e-mail e CPF para
                identificação e autenticação segura;
              </li>
              <li>
                <strong>Localização:</strong> dados de localização e CEP para
                alertas específicos à região;
              </li>
              <li>
                <strong>Agrícola:</strong> culturas, produtividade, irrigação e
                insumos utilizados;
              </li>
              <li>
                <strong>Climático:</strong> informações climáticas associadas ao
                perfil de cultivo.
              </li>
            </ul>

            <h3 className={styles.subTitle}>Finalidade da coleta</h3>
            <ul className={styles.list}>
              <li>Permitir o uso do sistema e autenticação do usuário;</li>
              <li>Gerar relatórios e recomendações técnicas personalizadas;</li>
              <li>Enviar notificações e alertas climáticos;</li>
              <li>Manter o histórico agrícola do usuário;</li>
              <li>Melhorar continuamente o desempenho e a precisão do sistema.</li>
            </ul>
          </section>

          <section id="seguranca" ref={setRef('seguranca')} className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Segurança e compartilhamento</h2>
            <p>
              O IAgro adota medidas técnicas e administrativas para garantir a
              proteção dos dados:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Criptografia:</strong> dados criptografados e armazenamento
                seguro no Firebase;
              </li>
              <li>
                <strong>Autenticação:</strong> login via Firebase Authentication;
              </li>
              <li>
                <strong>Controle de acesso:</strong> controle rigoroso e auditoria
                de atividades;
              </li>
              <li>
                <strong>Resposta a incidentes:</strong> política ativa de resposta a
                incidentes de segurança.
              </li>
            </ul>

            <h3 className={styles.subTitle}>Compartilhamento de dados</h3>
            <p>
              Os dados coletados{' '}
              <strong>não serão compartilhados com terceiros</strong>, salvo
              mediante autorização expressa do titular, obrigação legal ou decisão
              judicial, ou suporte técnico restrito e controlado. Qualquer
              compartilhamento será comunicado ao usuário e realizado apenas com
              parceiros que adotem medidas de segurança equivalentes.
            </p>
          </section>

          <section id="seus-direitos" ref={setRef('seus-direitos')} className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Seus direitos</h2>
            <p>
              O usuário poderá exercer seus direitos previstos na{' '}
              <strong>LGPD</strong>, incluindo:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Acesso:</strong> solicitar acesso a todos os seus dados
                armazenados;
              </li>
              <li>
                <strong>Retificação:</strong> corrigir informações incompletas ou
                inexatas;
              </li>
              <li>
                <strong>Exclusão:</strong> solicitar a exclusão de seus dados
                pessoais;
              </li>
              <li>
                <strong>Revogação de consentimento:</strong> revogar o consentimento
                dado anteriormente;
              </li>
              <li>
                <strong>Portabilidade:</strong> receber seus dados em formato
                estruturado;
              </li>
              <li>
                <strong>Informações de tratamento:</strong> saber como seus dados são
                tratados.
              </li>
            </ul>
          </section>

          <section id="contato" ref={setRef('contato')} className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Contato</h2>
            <p>
              Ao utilizar o IAgro, você reconhece que leu, compreendeu e concorda
              com todos os termos deste documento e da Política de Privacidade.
            </p>
            <div className={styles.contactCard}>
              <strong>Canal de contato LGPD</strong>
              <p style={{ margin: 'var(--space-2) 0 0' }}>
                Para exercer qualquer um dos direitos acima, entre em contato pelo
                e-mail abaixo. Prazo de resposta: até 15 dias úteis.
              </p>
              <a href={`mailto:${CONTACT_EMAIL}`} className={styles.contactLink}>
                {CONTACT_EMAIL}
              </a>
            </div>
          </section>
        </article>
      </div>

      <div className={styles.consent}>
        <div className={styles.consentInner}>
          <Checkbox
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          >
            Li e concordo com os Termos de Uso e a Política de Privacidade
          </Checkbox>
          <div className={styles.consentActions}>
            <Button variant="secondary" onClick={handleDecline}>
              Recusar
            </Button>
            <Button onClick={handleAccept} disabled={!accepted}>
              Aceitar e continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermoDeUso;
