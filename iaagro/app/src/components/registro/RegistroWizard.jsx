import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, TextField, SelectField, InlineAlert } from '../ui';
import {
  LuArrowLeft,
  LuArrowRight,
  LuFileText,
  LuCheck,
  LuWarehouse,
  LuUser,
  LuCalendar,
  LuInfo,
  LuCircleCheck,
} from '../ui/icons';
import styles from './RegistroWizard.module.css';

const STEPS = ['Cultura', 'Manejo', 'Revisão'];
const DRAFT_KEY = 'iaagro:registroDraft';

const ATIVIDADES = ['Plantio', 'Colheita', 'Adubação', 'Defensivos', 'Irrigação', 'Outro'];
const CULTURAS = ['Soja', 'Milho', 'Trigo', 'Feijão'];
const SOLOS = ['Argiloso', 'Arenoso', 'Humoso'];
const IRRIGACOES = ['Gotejamento', 'Aspersão', 'Pivô central', 'Sulco', 'Sequeiro'];

const EMPTY = {
  tipoAtividade: '',
  tipoCultura: '',
  talhao: '',
  tipoSolo: '',
  dataPlantio: '',
  dataColheita: '',
  custosOperacionais: '',
  rendimentoFinal: '',
  observacoes: '',
  // Manejo
  dataTipoAdubacao: '',
  usoDefensivos: '',
  ocorrenciaPragas: '',
  tipoIrrigacao: '',
  aplicacoesManejo: '',
  perdasObservadas: '',
  custosOperacionaisSec: '',
  producaoRentados: '',
};

const REQUIRED = ['tipoAtividade', 'tipoCultura', 'tipoSolo', 'dataPlantio'];

const RegistroWizard = ({
  profile = {},
  userName = '',
  propertyName = '',
  onSubmit,
  onCancel,
  onGoHistorico,
}) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);
  const topRef = useRef(null);

  // Carregar rascunho local
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.form) {
          setForm({ ...EMPTY, ...parsed.form });
          setSavedAt(parsed.savedAt || null);
        }
      }
    } catch (_) {
      /* rascunho inválido, ignora */
    }
  }, []);

  // Prevenir perda de alterações não salvas ao fechar a aba
  useEffect(() => {
    const handler = (e) => {
      if (dirty && !done) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, done]);

  const pending = useMemo(
    () => REQUIRED.filter((k) => !String(form[k] || '').trim()).length,
    [form]
  );

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep1 = () => {
    const next = {};
    REQUIRED.forEach((k) => {
      if (!String(form[k] || '').trim()) next[k] = 'Campo obrigatório.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveDraft = () => {
    const stamp = new Date().toISOString();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, savedAt: stamp }));
      setSavedAt(stamp);
      setDirty(false);
    } catch (_) {
      /* storage indisponível */
    }
  };

  const handleCancel = () => {
    if (dirty && !window.confirm('Descartar as alterações não salvas deste registro?')) {
      return;
    }
    onCancel?.();
  };

  const submit = async () => {
    if (!validateStep1()) {
      setStep(0);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await onSubmit?.(form);
      if (result && result.success === false) {
        setSubmitError(result.error || 'Não foi possível salvar o registro.');
      } else {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (_) {
          /* ignora */
        }
        setDirty(false);
        setDone(true);
      }
    } catch (err) {
      setSubmitError(err.message || 'Não foi possível salvar o registro.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnother = () => {
    setForm(EMPTY);
    setErrors({});
    setDone(false);
    setStep(0);
    setSavedAt(null);
    setDirty(false);
  };

  if (done) {
    return (
      <div className={styles.doneWrap}>
        <span className={styles.doneIcon} aria-hidden="true">
          <LuCircleCheck size={40} />
        </span>
        <h1 className={styles.doneTitle}>Registro salvo</h1>
        <p className={styles.doneText}>
          O histórico da propriedade foi atualizado.
        </p>
        <div className={styles.doneActions}>
          <Button onClick={onGoHistorico}>Ver histórico</Button>
          <Button variant="secondary" onClick={resetForAnother}>
            Adicionar outro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wizard} ref={topRef}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Novo registro agronômico</h1>
          <p className={styles.subtitle}>
            Documente uma atividade para manter o histórico da propriedade atualizado.
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<LuFileText size={18} />}
          onClick={saveDraft}
        >
          Salvar rascunho
        </Button>
      </header>

      <Stepper step={step} onSelect={(i) => i < step && setStep(i)} />

      <div className={styles.body}>
        <div className={styles.formCol}>
          {step === 0 && (
            <fieldset className={styles.group}>
              <legend className={styles.groupTitle}>Dados da cultura</legend>
              <div className={styles.grid2}>
                <SelectField
                  label="Tipo de atividade"
                  required
                  placeholder="Selecione"
                  value={form.tipoAtividade}
                  onChange={(e) => set('tipoAtividade', e.target.value)}
                  error={errors.tipoAtividade}
                  options={ATIVIDADES.map((a) => ({ value: a, label: a }))}
                />
                <SelectField
                  label="Cultura"
                  required
                  placeholder="Selecione"
                  value={form.tipoCultura}
                  onChange={(e) => set('tipoCultura', e.target.value)}
                  error={errors.tipoCultura}
                  options={CULTURAS.map((c) => ({ value: c.toLowerCase(), label: c }))}
                />
                <TextField
                  label="Talhão"
                  value={form.talhao}
                  onChange={(e) => set('talhao', e.target.value)}
                  placeholder="Ex.: Talhão 12"
                />
                <SelectField
                  label="Tipo de solo"
                  required
                  placeholder="Selecione"
                  value={form.tipoSolo}
                  onChange={(e) => set('tipoSolo', e.target.value)}
                  error={errors.tipoSolo}
                  options={SOLOS.map((s) => ({ value: s.toLowerCase(), label: s }))}
                />
                <TextField
                  label="Data do plantio"
                  type="date"
                  required
                  value={form.dataPlantio}
                  onChange={(e) => set('dataPlantio', e.target.value)}
                  error={errors.dataPlantio}
                />
                <TextField
                  label="Data prevista da colheita"
                  type="date"
                  value={form.dataColheita}
                  onChange={(e) => set('dataColheita', e.target.value)}
                />
                <TextField
                  label="Custos operacionais"
                  inputMode="numeric"
                  prefix="R$"
                  value={form.custosOperacionais}
                  onChange={(e) => set('custosOperacionais', maskMoney(e.target.value))}
                  placeholder="0,00"
                />
                <TextField
                  label="Rendimento esperado"
                  inputMode="numeric"
                  suffix="kg/ha"
                  value={form.rendimentoFinal}
                  onChange={(e) => set('rendimentoFinal', maskInt(e.target.value))}
                  placeholder="0"
                />
              </div>
              <TextField
                label="Observações"
                multiline
                rows={4}
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Notas sobre a atividade (opcional)"
              />
            </fieldset>
          )}

          {step === 1 && (
            <fieldset className={styles.group}>
              <legend className={styles.groupTitle}>Manejo</legend>
              <div className={styles.grid2}>
                <TextField
                  label="Adubação"
                  value={form.dataTipoAdubacao}
                  onChange={(e) => set('dataTipoAdubacao', e.target.value)}
                  placeholder="Tipo e data da adubação"
                />
                <TextField
                  label="Defensivos"
                  value={form.usoDefensivos}
                  onChange={(e) => set('usoDefensivos', e.target.value)}
                  placeholder="Produtos aplicados"
                />
                <TextField
                  label="Pragas / doenças"
                  value={form.ocorrenciaPragas}
                  onChange={(e) => set('ocorrenciaPragas', e.target.value)}
                  placeholder="Ocorrências observadas"
                />
                <SelectField
                  label="Irrigação"
                  placeholder="Selecione"
                  value={form.tipoIrrigacao}
                  onChange={(e) => set('tipoIrrigacao', e.target.value)}
                  options={IRRIGACOES.map((i) => ({ value: i, label: i }))}
                />
                <TextField
                  label="Aplicações de manejo"
                  value={form.aplicacoesManejo}
                  onChange={(e) => set('aplicacoesManejo', e.target.value)}
                  placeholder="Tratos culturais"
                />
                <TextField
                  label="Perdas observadas"
                  value={form.perdasObservadas}
                  onChange={(e) => set('perdasObservadas', e.target.value)}
                  placeholder="Percentual ou descrição"
                />
                <TextField
                  label="Custos secundários"
                  inputMode="numeric"
                  prefix="R$"
                  value={form.custosOperacionaisSec}
                  onChange={(e) => set('custosOperacionaisSec', maskMoney(e.target.value))}
                  placeholder="0,00"
                />
                <TextField
                  label="Produção / arrendamento"
                  value={form.producaoRentados}
                  onChange={(e) => set('producaoRentados', e.target.value)}
                  placeholder="Sacas, área arrendada…"
                />
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <div className={styles.group}>
              <h2 className={styles.groupTitle}>Revisão</h2>
              <p className={styles.reviewIntro}>
                Confira os dados antes de salvar. Você pode voltar para ajustar.
              </p>
              <ReviewGroup title="Cultura" items={reviewCultura(form)} />
              <ReviewGroup title="Manejo" items={reviewManejo(form)} />
              {submitError && (
                <InlineAlert variant="error" className={styles.reviewAlert}>
                  {submitError}
                </InlineAlert>
              )}
            </div>
          )}
        </div>

        {/* Resumo lateral */}
        <aside className={styles.summary} aria-label="Resumo do registro">
          <h2 className={styles.summaryTitle}>Resumo do registro</h2>
          <SummaryRow icon={<LuWarehouse size={18} />} label="Propriedade" value={propertyName || '—'} />
          <SummaryRow icon={<LuFileText size={18} />} label="Cultura" value={capitalize(form.tipoCultura) || '—'} />
          <SummaryRow icon={<LuUser size={18} />} label="Autor" value={userName || '—'} />
          <SummaryRow
            icon={<LuCalendar size={18} />}
            label="Último salvamento"
            value={savedAt ? formatStamp(savedAt) : 'Não salvo'}
          />
          <div className={`${styles.pending} ${pending === 0 ? styles.pendingOk : ''}`}>
            <LuInfo size={16} aria-hidden="true" />
            Campos obrigatórios pendentes: {pending}
          </div>
        </aside>
      </div>

      {/* Rodapé de navegação */}
      <footer className={styles.footer}>
        {step === 0 ? (
          <Button variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
        ) : (
          <Button variant="secondary" leftIcon={<LuArrowLeft size={18} />} onClick={goBack}>
            Voltar
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button rightIcon={<LuArrowRight size={18} />} onClick={goNext}>
            {step === 0 ? 'Continuar para manejo' : 'Continuar para revisão'}
          </Button>
        ) : (
          <Button leftIcon={<LuCheck size={18} />} loading={submitting} onClick={submit}>
            Salvar registro
          </Button>
        )}
      </footer>
    </div>
  );
};

/* ---------- Subcomponentes ---------- */

const Stepper = ({ step, onSelect }) => (
  <ol className={styles.stepper}>
    {STEPS.map((label, i) => {
      const state = i < step ? 'done' : i === step ? 'current' : 'upcoming';
      return (
        <li key={label} className={styles.step}>
          <button
            type="button"
            className={`${styles.stepBtn} ${styles[state]}`}
            onClick={() => onSelect(i)}
            disabled={i >= step}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className={styles.stepNum}>
              {state === 'done' ? <LuCheck size={16} /> : i + 1}
            </span>
            <span className={styles.stepLabel}>{label}</span>
          </button>
          {i < STEPS.length - 1 && (
            <span className={`${styles.stepLine} ${i < step ? styles.stepLineOn : ''}`} aria-hidden="true" />
          )}
        </li>
      );
    })}
  </ol>
);

const SummaryRow = ({ icon, label, value }) => (
  <div className={styles.summaryRow}>
    <span className={styles.summaryIcon} aria-hidden="true">{icon}</span>
    <span className={styles.summaryMeta}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </span>
  </div>
);

const ReviewGroup = ({ title, items }) => {
  const filled = items.filter((it) => it.value);
  return (
    <div className={styles.reviewGroup}>
      <h3 className={styles.reviewTitle}>{title}</h3>
      {filled.length > 0 ? (
        <dl className={styles.reviewList}>
          {filled.map((it) => (
            <div key={it.label} className={styles.reviewItem}>
              <dt>{it.label}</dt>
              <dd>{it.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.reviewEmpty}>Nenhum dado preenchido nesta etapa.</p>
      )}
    </div>
  );
};

/* ---------- Helpers ---------- */

function reviewCultura(f) {
  return [
    { label: 'Tipo de atividade', value: f.tipoAtividade },
    { label: 'Cultura', value: capitalize(f.tipoCultura) },
    { label: 'Talhão', value: f.talhao },
    { label: 'Tipo de solo', value: capitalize(f.tipoSolo) },
    { label: 'Data do plantio', value: formatDate(f.dataPlantio) },
    { label: 'Colheita prevista', value: formatDate(f.dataColheita) },
    { label: 'Custos operacionais', value: f.custosOperacionais ? `R$ ${f.custosOperacionais}` : '' },
    { label: 'Rendimento esperado', value: f.rendimentoFinal ? `${f.rendimentoFinal} kg/ha` : '' },
    { label: 'Observações', value: f.observacoes },
  ];
}

function reviewManejo(f) {
  return [
    { label: 'Adubação', value: f.dataTipoAdubacao },
    { label: 'Defensivos', value: f.usoDefensivos },
    { label: 'Pragas / doenças', value: f.ocorrenciaPragas },
    { label: 'Irrigação', value: f.tipoIrrigacao },
    { label: 'Aplicações de manejo', value: f.aplicacoesManejo },
    { label: 'Perdas observadas', value: f.perdasObservadas },
    { label: 'Custos secundários', value: f.custosOperacionaisSec ? `R$ ${f.custosOperacionaisSec}` : '' },
    { label: 'Produção / arrendamento', value: f.producaoRentados },
  ];
}

function maskMoney(v) {
  const digits = String(v || '').replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10) / 100;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function maskInt(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  return parseInt(d, 10).toLocaleString('pt-BR');
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(v) {
  if (!v) return '';
  const [y, m, d] = v.split('-');
  if (!y || !m || !d) return v;
  return `${d}/${m}/${y}`;
}

function formatStamp(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return '—';
  }
}

export default RegistroWizard;
