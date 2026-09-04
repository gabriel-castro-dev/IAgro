import React, { useState } from 'react';
import { calcularProdutividade, calcularIrrigacao } from '../../services/calculatorService';
import { Button, TextField, SelectField, InlineAlert } from '../ui';
import { LuChartColumnBig, LuDroplet, LuInfo } from '../ui/icons';
import styles from './Calculadoras.module.css';

const UNIDADES = [
  { value: 'sacas', label: 'Sacas (60 kg)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
];
const CULTURAS = ['soja', 'milho', 'trigo', 'feijao', 'algodao', 'cafe', 'cana'];
const ESTADIOS = [
  { value: 'inicial', label: 'Inicial' },
  { value: 'vegetativo', label: 'Vegetativo' },
  { value: 'floracao', label: 'Floração' },
  { value: 'maturacao', label: 'Maturação' },
];
const SOLOS = [
  { value: 'arenoso', label: 'Arenoso' },
  { value: 'medio', label: 'Médio' },
  { value: 'argiloso', label: 'Argiloso' },
];

const num = (v) => {
  const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
const brl = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0);
const dec = (n, d = 1) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);

const Calculadoras = () => {
  return (
    <div className={styles.wrap}>
      <div>
        <h2 className={styles.title}>Calculadoras agronômicas</h2>
        <p className={styles.subtitle}>Faça estimativas rápidas antes de registrar uma decisão.</p>
      </div>

      <div className={styles.grid}>
        <ProdutividadeCalc />
        <IrrigacaoCalc />
      </div>

      <p className={styles.disclaimer}>
        <LuInfo size={16} aria-hidden="true" />
        Estimativas de apoio à decisão. Valide as recomendações com um profissional habilitado.
      </p>
    </div>
  );
};

/* ---------- Produtividade e rentabilidade ---------- */
const ProdutividadeCalc = () => {
  const [f, setF] = useState({ area: '', producao: '', unidade: 'sacas', custoTotal: '', precoVenda: '' });
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');

  const valid = num(f.area) > 0 && num(f.producao) > 0 && num(f.custoTotal) >= 0;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const calc = () => {
    setError('');
    const r = calcularProdutividade({
      area: num(f.area),
      producao: num(f.producao),
      custoTotal: num(f.custoTotal),
      precoVenda: num(f.precoVenda) || 0,
      unidade: f.unidade,
    });
    if (r.success) setRes(r.data);
    else {
      setRes(null);
      setError(r.error);
    }
  };
  const clear = () => {
    setF({ area: '', producao: '', unidade: 'sacas', custoTotal: '', precoVenda: '' });
    setRes(null);
    setError('');
  };

  return (
    <section className={styles.card} aria-label="Produtividade e rentabilidade">
      <header className={styles.cardHead}>
        <span className={styles.cardIcon} aria-hidden="true"><LuChartColumnBig size={20} /></span>
        <h3 className={styles.cardTitle}>Produtividade e rentabilidade</h3>
      </header>

      <div className={styles.fields}>
        <TextField label="Área" suffix="ha" inputMode="decimal" value={f.area}
          onChange={(e) => set('area', e.target.value)} placeholder="0" />
        <TextField label="Produção" inputMode="decimal" value={f.producao}
          onChange={(e) => set('producao', e.target.value)} placeholder="0" />
        <SelectField label="Unidade" value={f.unidade} onChange={(e) => set('unidade', e.target.value)} options={UNIDADES} />
        <TextField label="Custo total" prefix="R$" inputMode="decimal" value={f.custoTotal}
          onChange={(e) => set('custoTotal', e.target.value)} placeholder="0" />
        <TextField label="Preço de venda" prefix="R$" inputMode="decimal" value={f.precoVenda}
          onChange={(e) => set('precoVenda', e.target.value)} placeholder="Opcional" />
      </div>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={clear}>Limpar</Button>
        <Button onClick={calc} disabled={!valid}>Calcular</Button>
      </div>

      {res && (
        <ResultBand
          items={[
            { label: 'Produtividade', value: `${dec(res.produtividadeHaSacas)} sc/ha` },
            { label: 'Custo por hectare', value: brl(res.custoHa) },
            { label: res.lucroTotal ? 'Lucro estimado' : 'Receita', value: brl(res.lucroTotal || res.receitaTotal) },
          ]}
        />
      )}
    </section>
  );
};

/* ---------- Necessidade de irrigação ---------- */
const IrrigacaoCalc = () => {
  const [f, setF] = useState({ cultura: 'soja', area: '', temperatura: '', umidadeAr: '', estadio: 'floracao', solo: 'argiloso' });
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');

  const valid = f.cultura && num(f.area) > 0 && num(f.temperatura) >= -50 && String(f.temperatura).trim() !== '';
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const calc = () => {
    setError('');
    const r = calcularIrrigacao({
      cultura: f.cultura,
      area: num(f.area),
      temperatura: num(f.temperatura),
      umidadeAr: num(f.umidadeAr) || undefined,
      estadioDesenvolvimento: f.estadio,
      tipoSolo: f.solo,
    });
    if (r.success) setRes(r.data);
    else {
      setRes(null);
      setError(r.error);
    }
  };
  const clear = () => {
    setF({ cultura: 'soja', area: '', temperatura: '', umidadeAr: '', estadio: 'floracao', solo: 'argiloso' });
    setRes(null);
    setError('');
  };

  return (
    <section className={styles.card} aria-label="Necessidade de irrigação">
      <header className={styles.cardHead}>
        <span className={styles.cardIcon} aria-hidden="true"><LuDroplet size={20} /></span>
        <h3 className={styles.cardTitle}>Necessidade de irrigação</h3>
      </header>

      <div className={styles.fields}>
        <SelectField label="Cultura" value={f.cultura} onChange={(e) => set('cultura', e.target.value)}
          options={CULTURAS.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
        <TextField label="Área" suffix="ha" inputMode="decimal" value={f.area}
          onChange={(e) => set('area', e.target.value)} placeholder="0" />
        <TextField label="Temperatura média" suffix="°C" inputMode="decimal" value={f.temperatura}
          onChange={(e) => set('temperatura', e.target.value)} placeholder="0" />
        <TextField label="Umidade do ar" suffix="%" inputMode="decimal" value={f.umidadeAr}
          onChange={(e) => set('umidadeAr', e.target.value)} placeholder="Opcional" />
        <SelectField label="Estádio" value={f.estadio} onChange={(e) => set('estadio', e.target.value)} options={ESTADIOS} />
        <SelectField label="Solo" value={f.solo} onChange={(e) => set('solo', e.target.value)} options={SOLOS} />
      </div>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={clear}>Limpar</Button>
        <Button onClick={calc} disabled={!valid}>Calcular</Button>
      </div>

      {res && (
        <ResultBand
          items={[
            { label: 'Lâmina diária', value: `${dec(res.laminaDiaria)} mm` },
            { label: 'Volume estimado', value: `${new Intl.NumberFormat('pt-BR').format(Math.round(res.volumeTotalDia))} m³/dia` },
            { label: 'Frequência', value: `${res.frequenciaDias} dias` },
          ]}
        />
      )}
    </section>
  );
};

const ResultBand = ({ items }) => (
  <div className={styles.resultBand} role="status" aria-live="polite">
    {items.map((it) => (
      <div key={it.label} className={styles.resultItem}>
        <span className={styles.resultLabel}>{it.label}</span>
        <strong className={`${styles.resultValue} tabular`}>{it.value}</strong>
      </div>
    ))}
  </div>
);

export default Calculadoras;
