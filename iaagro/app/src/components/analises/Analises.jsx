import React, { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { getWeatherByCEP, getWeatherByCity } from '../../services/weatherService';
import {
  calculateGeneralStats,
  processProductivityData,
  processCostAnalysisData,
  processCropComparisonData,
} from '../../services/chartDataService';
import { Button, SelectField, Spinner } from '../ui';
import {
  LuDownload, LuSun, LuDroplet, LuWind, LuGauge, LuCircleCheck,
  LuTrendingUp, LuDollarSign, LuLeaf, LuClipboardList, LuChartPie,
} from '../ui/icons';
import Calculadoras from './Calculadoras';
import styles from './Analises.module.css';

const TABS = [
  { key: 'visao', label: 'Visão geral' },
  { key: 'custos', label: 'Custos' },
  { key: 'culturas', label: 'Culturas' },
  { key: 'calc', label: 'Calculadoras' },
];
const PERIODS = [
  { value: '3', label: 'Últimos 3 meses' },
  { value: '6', label: 'Últimos 6 meses' },
  { value: '12', label: 'Últimos 12 meses' },
  { value: 'all', label: 'Todo o período' },
];
const COST_COLORS = ['#164c3b', '#b65f3c', '#789269', '#c89a3d', '#2f8064', '#647067'];

const Analises = ({ profile = {}, historico = [], onNavigate }) => {
  const [tab, setTab] = useState('visao');
  const [period, setPeriod] = useState('6');
  const [chartMode, setChartMode] = useState('mensal');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setWeatherLoading(true);
      let r = null;
      if (profile.cep) r = await getWeatherByCEP(profile.cep);
      if ((!r || !r.success) && profile.cidade) r = await getWeatherByCity(profile.cidade);
      if (active) {
        setWeather(r && r.success ? r.data : null);
        setWeatherLoading(false);
      }
    })();
    return () => { active = false; };
  }, [profile.cep, profile.cidade]);

  const filtered = useMemo(() => filterByPeriod(historico, period), [historico, period]);
  const enriched = useMemo(() => filtered.map((i) => ({ ...i, tipo: deriveTipo(i) })), [filtered]);
  const stats = useMemo(() => calculateGeneralStats(filtered), [filtered]);
  const cost = useMemo(() => processCostAnalysisData(enriched), [enriched]);
  const crop = useMemo(() => processCropComparisonData(filtered), [filtered]);

  const chartData = useMemo(() => {
    const base = processProductivityData(filtered);
    if (chartMode !== 'acumulado') return base;
    let r = 0, c = 0;
    return base.map((d) => { r += d.rendimento; c += d.custo; return { ...d, rendimento: r, custo: c }; });
  }, [filtered, chartMode]);

  const prodTrend = trend(processProductivityData(filtered).map((d) => d.rendimento));
  const hasData = filtered.length > 0;

  const exportCsv = () => {
    const rows = [['Cultura', 'Rendimento médio (kg/ha)', 'Custo total (R$)', 'Registros']];
    crop.forEach((c) => rows.push([c.cultura, c.rendimentoMedio, c.custoTotal, c.registros]));
    downloadCsv(rows, 'analises-culturas.csv');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Análises da propriedade</h1>
          <p className={styles.subtitle}>Acompanhe produtividade, custos e condições de campo.</p>
        </div>
        <div className={styles.headerActions}>
          <SelectField
            aria-label="Período"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={PERIODS}
            className={styles.periodSelect}
          />
          <Button variant="secondary" leftIcon={<LuDownload size={18} />} onClick={exportCsv} disabled={crop.length === 0}>
            Exportar
          </Button>
        </div>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label="Seções de análise">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'calc' ? (
        <Calculadoras />
      ) : (
        <>
          {/* Faixa de clima */}
          <WeatherBand weather={weather} loading={weatherLoading} />

          {/* KPIs */}
          <div className={styles.kpis}>
            <Kpi icon={<LuTrendingUp size={20} />} label="Produtividade média"
              value={hasData ? `${num(stats.rendimentoMedio)}` : '—'} unit={hasData ? 'kg/ha' : ''} delta={prodTrend} />
            <Kpi icon={<LuDollarSign size={20} />} label="Custo total"
              value={hasData ? brl(stats.totalCustos) : '—'} />
            <Kpi icon={<LuLeaf size={20} />} label="Culturas ativas"
              value={stats.culturasMaisUsadas?.length || 0} />
            <Kpi icon={<LuClipboardList size={20} />} label="Atividades" value={stats.totalRegistros} />
          </div>

          {tab === 'visao' && (
            <>
              <div className={styles.row2}>
                <ChartCard title="Produtividade x custo"
                  right={<Segmented value={chartMode} onChange={setChartMode} />}>
                  {chartData.length > 0 ? <ProdChart data={chartData} /> : <Empty onNavigate={onNavigate} />}
                </ChartCard>
                <ChartCard title="Distribuição de custos">
                  {cost.length > 0 ? <CostDonut data={cost} /> : <Empty small onNavigate={onNavigate} />}
                </ChartCard>
              </div>
              <CropTable crop={crop} />
            </>
          )}

          {tab === 'custos' && (
            <>
              <div className={styles.row2}>
                <ChartCard title="Distribuição de custos">
                  {cost.length > 0 ? <CostDonut data={cost} /> : <Empty small onNavigate={onNavigate} />}
                </ChartCard>
                <ChartCard title="Custo por categoria">
                  {cost.length > 0 ? <CostBars data={cost} /> : <Empty small onNavigate={onNavigate} />}
                </ChartCard>
              </div>
            </>
          )}

          {tab === 'culturas' && <CropTable crop={crop} expanded />}
        </>
      )}
    </div>
  );
};

/* ---------- Blocos ---------- */

const WeatherBand = ({ weather, loading }) => {
  if (loading) {
    return <div className={`${styles.band} ${styles.bandLoading}`}><Spinner label="Carregando clima" /></div>;
  }
  if (!weather) {
    return <div className={styles.band}><span className={styles.bandMuted}>Sem dados de clima. Configure o CEP no Perfil.</span></div>;
  }
  const favorable = weather.temp >= 15 && weather.temp <= 30 && weather.humidity >= 30 && weather.humidity <= 80 && weather.windSpeed <= 5;
  return (
    <div className={styles.band}>
      <div className={styles.bandMain}>
        <LuSun size={30} className={styles.bandSun} aria-hidden="true" />
        <div>
          <span className={styles.bandPlace}>Condições em {weather.city}</span>
          <span className={styles.bandTemp}><span className="tabular">{weather.temp}</span>°C</span>
        </div>
      </div>
      <BandMetric icon={<LuDroplet size={18} />} label="Umidade" value={`${weather.humidity}%`} />
      <BandMetric icon={<LuWind size={18} />} label="Vento" value={`${weather.windSpeed} m/s`} />
      <BandMetric icon={<LuGauge size={18} />} label="Pressão" value={`${weather.pressure} hPa`} />
      <div className={`${styles.bandStatus} ${favorable ? styles.bandOk : styles.bandWarn}`}>
        <LuCircleCheck size={18} aria-hidden="true" />
        {favorable ? 'Condições favoráveis' : 'Atenção às condições'}
      </div>
    </div>
  );
};

const BandMetric = ({ icon, label, value }) => (
  <div className={styles.bandMetric}>
    <span className={styles.bandMetricLabel}>{icon} {label}</span>
    <strong className="tabular">{value}</strong>
  </div>
);

const Kpi = ({ icon, label, value, unit, delta }) => (
  <div className={styles.kpi}>
    <span className={styles.kpiIcon} aria-hidden="true">{icon}</span>
    <span className={styles.kpiLabel}>{label}</span>
    <span className={styles.kpiValue}><span className="tabular">{value}</span>{unit && <span className={styles.kpiUnit}>{unit}</span>}</span>
    {delta != null && delta !== 0 && (
      <span className={`${styles.kpiDelta} ${delta > 0 ? styles.up : styles.down}`}>
        {delta > 0 ? '+' : ''}{delta}% {delta > 0 ? '↑' : '↓'}
      </span>
    )}
  </div>
);

const ChartCard = ({ title, right, children }) => (
  <section className={styles.card}>
    <div className={styles.cardHead}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

const Segmented = ({ value, onChange }) => (
  <div className={styles.segmented} role="tablist" aria-label="Modo do gráfico">
    {['mensal', 'acumulado'].map((m) => (
      <button key={m} role="tab" aria-selected={value === m}
        className={`${styles.segBtn} ${value === m ? styles.segActive : ''}`} onClick={() => onChange(m)}>
        {m === 'mensal' ? 'Mensal' : 'Acumulado'}
      </button>
    ))}
  </div>
);

const ProdChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
      <CartesianGrid stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
      <YAxis yAxisId="l" tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }} tickLine={false} axisLine={false} tickFormatter={num} />
      <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }} tickLine={false} axisLine={false} tickFormatter={num} />
      <Tooltip content={<ChartTip />} />
      <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle"
        formatter={(v) => (v === 'rendimento' ? 'Produtividade (kg/ha)' : 'Custo (R$)')} />
      <Bar yAxisId="l" dataKey="rendimento" name="rendimento" fill="#164c3b" radius={[4, 4, 0, 0]} maxBarSize={36} />
      <Line yAxisId="r" type="monotone" dataKey="custo" name="custo" stroke="#c89a3d" strokeWidth={2.5} dot={{ r: 3 }} />
    </ComposedChart>
  </ResponsiveContainer>
);

const CostDonut = ({ data }) => {
  const total = data.reduce((s, d) => s + d.valor, 0);
  return (
    <div className={styles.donutWrap}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" innerRadius={54} outerRadius={86} paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={COST_COLORS[i % COST_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<DonutTip total={total} />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className={styles.legend}>
        {data.map((d, i) => (
          <li key={d.categoria} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: COST_COLORS[i % COST_COLORS.length] }} aria-hidden="true" />
            <span className={styles.legendLabel}>{d.categoria}</span>
            <span className={styles.legendVal}>{total ? Math.round((d.valor / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CostBars = ({ data }) => (
  <ResponsiveContainer width="100%" height={240}>
    <ComposedChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
      <CartesianGrid stroke="var(--color-border)" horizontal={false} />
      <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }} tickLine={false} axisLine={false} tickFormatter={num} />
      <YAxis type="category" dataKey="categoria" tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }} tickLine={false} axisLine={false} width={80} />
      <Tooltip content={<ChartTip money />} />
      <Bar dataKey="valor" name="valor" fill="#164c3b" radius={[0, 4, 4, 0]} maxBarSize={22} />
    </ComposedChart>
  </ResponsiveContainer>
);

const CropTable = ({ crop, expanded }) => (
  <section className={styles.card}>
    <div className={styles.cardHead}><h2 className={styles.cardTitle}>Desempenho por cultura</h2></div>
    {crop.length > 0 ? (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cultura</th>
              <th className={styles.numCol}>Produtividade média (kg/ha)</th>
              <th className={styles.numCol}>Custo total (R$)</th>
              <th className={styles.numCol}>Registros</th>
            </tr>
          </thead>
          <tbody>
            {crop.map((c) => (
              <tr key={c.cultura}>
                <td>{c.cultura}</td>
                <td className={`${styles.numCol} tabular`}>{num(c.rendimentoMedio)}</td>
                <td className={`${styles.numCol} tabular`}>{brl(c.custoTotal)}</td>
                <td className={`${styles.numCol} tabular`}>{c.registros}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className={styles.tableEmpty}>Sem dados por cultura no período selecionado.</p>
    )}
  </section>
);

const Empty = ({ onNavigate, small }) => (
  <div className={`${styles.empty} ${small ? styles.emptySmall : ''}`}>
    <img src="/assets/illustrations/empty-field.svg" alt="" className={styles.emptyArt} />
    <strong>Sem dados no período</strong>
    <p>Registre atividades para ver as análises.</p>
    {onNavigate && <Button variant="secondary" size="sm" onClick={() => onNavigate('meus-dados')}>Criar registro</Button>}
  </div>
);

const ChartTip = ({ active, payload, label, money }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tip}>
      {label && <strong>{label}</strong>}
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tipRow}>
          <span className={styles.tipDot} style={{ backgroundColor: p.color || p.fill }} aria-hidden="true" />
          {p.dataKey === 'rendimento' ? `Produtividade: ${num(p.value)} kg/ha`
            : p.dataKey === 'valor' || money ? `${p.payload.categoria || 'Valor'}: ${brl(p.value)}`
            : `Custo: ${brl(p.value)}`}
        </div>
      ))}
    </div>
  );
};

const DonutTip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className={styles.tip}>
      <strong>{p.name}</strong>
      <div className={styles.tipRow}>{brl(p.value)} · {total ? Math.round((p.value / total) * 100) : 0}%</div>
    </div>
  );
};

/* ---------- Helpers ---------- */
function num(n) { return new Intl.NumberFormat('pt-BR').format(Math.round(n || 0)); }
function brl(n) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0); }

function mainDate(item) {
  const s = item.dataPlantio || item.dataColheita || item.data;
  if (!s) return null;
  if (s.includes('-')) return new Date(s);
  if (s.includes('/')) { const [d, m, y] = s.split('/'); return new Date(y, m - 1, d); }
  return null;
}
function filterByPeriod(list, period) {
  if (period === 'all') return list;
  const months = parseInt(period, 10);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return list.filter((item) => {
    const d = mainDate(item);
    return !d || d >= cutoff; // mantém itens sem data
  });
}
function deriveTipo(item) {
  if (item.tipoAtividade) return item.tipoAtividade;
  if (item.dataTipoAdubacao) return 'Adubação';
  if (item.usoDefensivos) return 'Defensivos';
  if (item.tipoIrrigacao) return 'Irrigação';
  if (item.dataColheita && !item.dataPlantio) return 'Colheita';
  if (item.tipoCultura || item.dataPlantio) return 'Plantio';
  return 'Outros';
}
function trend(values) {
  const v = values.filter((n) => n > 0);
  if (v.length < 2) return null;
  const last = v[v.length - 1];
  const prev = v[v.length - 2];
  if (!prev) return null;
  return Math.round(((last - prev) / prev) * 100);
}
function downloadCsv(rows, filename) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default Analises;
