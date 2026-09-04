import React, { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getWeatherByCEP, getWeatherByCity } from '../../services/weatherService';
import { getUpcomingTasks } from '../../services/taskService';
import {
  calculateGeneralStats,
  processProductivityData,
} from '../../services/chartDataService';
import { Button, Spinner } from '../ui';
import {
  LuPlus,
  LuSun,
  LuDroplet,
  LuWind,
  LuLeaf,
  LuFileText,
  LuTrendingUp,
  LuDollarSign,
  LuChevronRight,
  LuClipboardList,
  LuFlaskConical,
} from '../ui/icons';
import styles from './Dashboard.module.css';

const CHART_COLORS = {
  bar: '#164c3b',
  line: '#c89a3d',
};

const Dashboard = ({ userId, userName = '', profile = {}, historico = [], onNavigate }) => {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [chartMode, setChartMode] = useState('mensal');

  const firstName = (profile.nomeCompleto || userName || 'produtor')
    .toString()
    .trim()
    .split(/\s+/)[0];

  // Clima (CEP com fallback para cidade)
  useEffect(() => {
    let active = true;
    const load = async () => {
      setWeatherLoading(true);
      let result = null;
      if (profile.cep) result = await getWeatherByCEP(profile.cep);
      if ((!result || !result.success) && profile.cidade) {
        result = await getWeatherByCity(profile.cidade);
      }
      if (active) {
        setWeather(result && result.success ? result.data : null);
        setWeatherLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [profile.cep, profile.cidade]);

  // Próximas tarefas
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!userId) {
        setTasksLoading(false);
        return;
      }
      setTasksLoading(true);
      const result = await getUpcomingTasks(userId, 7);
      if (active) {
        setTasks(result.success ? result.data.slice(0, 3) : []);
        setTasksLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  const stats = useMemo(() => calculateGeneralStats(historico), [historico]);
  const culturasAtivas = stats.culturasMaisUsadas?.length || 0;
  const culturasLabel =
    stats.culturasMaisUsadas?.map((c) => capitalize(c.cultura)).join(', ') || '—';

  const chartData = useMemo(() => {
    const base = processProductivityData(historico);
    if (chartMode === 'acumulado') {
      let accR = 0;
      let accC = 0;
      return base.map((d) => {
        accR += d.rendimento;
        accC += d.custo;
        return { ...d, rendimento: accR, custo: accC };
      });
    }
    return base;
  }, [historico, chartMode]);

  const recentActivity = historico.slice(0, 3);
  const hasData = historico.length > 0;

  return (
    <div className={styles.dashboard}>
      {/* Cabeçalho */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            {greeting()}, {capitalize(firstName)}
          </h1>
          <p className={styles.subtitle}>Veja o que precisa da sua atenção hoje.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.today}>{todayLabel()}</span>
          <Button
            leftIcon={<LuPlus size={18} />}
            onClick={() => onNavigate('meus-dados')}
          >
            Novo registro
          </Button>
        </div>
      </header>

      {/* Linha 1: clima + tarefas */}
      <div className={styles.rowTop}>
        <section className={`${styles.card} ${styles.weatherCard}`} aria-label="Condições de hoje">
          <h2 className={styles.cardTitle}>Condições de hoje</h2>
          {weatherLoading ? (
            <div className={styles.cardLoading}>
              <Spinner label="Carregando clima" />
            </div>
          ) : weather ? (
            <>
              <p className={styles.weatherPlace}>
                {weather.city}
                {weather.country ? `, ${weather.country}` : ''}
              </p>
              <div className={styles.weatherMain}>
                <LuSun size={44} className={styles.weatherIcon} aria-hidden="true" />
                <div className={styles.weatherTemp}>
                  <span className="tabular">{weather.temp}</span>
                  <span className={styles.weatherUnit}>°C</span>
                </div>
                <div className={styles.weatherMetrics}>
                  <div>
                    <span className={styles.metricLabel}>
                      <LuDroplet size={15} aria-hidden="true" /> Umidade
                    </span>
                    <strong className="tabular">{weather.humidity}%</strong>
                  </div>
                  <div>
                    <span className={styles.metricLabel}>
                      <LuWind size={15} aria-hidden="true" /> Vento
                    </span>
                    <strong className="tabular">{weather.windSpeed} m/s</strong>
                  </div>
                </div>
              </div>
              <p className={styles.weatherDesc}>{capitalize(weather.description)}</p>
              <div className={styles.recommendation}>
                <LuLeaf size={18} aria-hidden="true" />
                {recommendation(weather)}
              </div>
            </>
          ) : (
            <div className={styles.emptyInline}>
              <p>Sem dados de clima.</p>
              <p className={styles.muted}>
                Cadastre o CEP ou a cidade da propriedade no{' '}
                <button className={styles.linkBtn} onClick={() => onNavigate('perfil')}>
                  Perfil
                </button>{' '}
                para ver o clima local.
              </p>
            </div>
          )}
        </section>

        <section className={`${styles.card} ${styles.tasksCard}`} aria-label="Próximas tarefas">
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Próximas tarefas</h2>
            <button className={styles.seeAll} onClick={() => onNavigate('historico')}>
              Ver todas
            </button>
          </div>
          {tasksLoading ? (
            <div className={styles.cardLoading}>
              <Spinner label="Carregando tarefas" />
            </div>
          ) : tasks.length > 0 ? (
            <ul className={styles.taskList}>
              {tasks.map((t) => (
                <li key={t.id} className={styles.taskItem}>
                  <span className={styles.taskIcon} aria-hidden="true">
                    <LuClipboardList size={18} />
                  </span>
                  <span className={styles.taskBody}>
                    <span className={styles.taskTitle}>{t.titulo}</span>
                    <span className={styles.taskMeta}>
                      {t.categoria || 'Geral'}
                    </span>
                  </span>
                  <span className={`${styles.taskDue} ${dueClass(t.dataLimite, styles)}`}>
                    {dueLabel(t.dataLimite)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyInline}>
              <p>Nenhuma tarefa nos próximos 7 dias.</p>
              <p className={styles.muted}>Você está em dia.</p>
            </div>
          )}
        </section>
      </div>

      {/* Linha 2: KPIs */}
      <div className={styles.kpis}>
        <Stat
          icon={<LuFileText size={20} />}
          label="Registros"
          value={stats.totalRegistros}
          hint="No total"
        />
        <Stat
          icon={<LuLeaf size={20} />}
          label="Culturas ativas"
          value={culturasAtivas}
          hint={culturasLabel}
        />
        <Stat
          icon={<LuTrendingUp size={20} />}
          label="Rendimento médio"
          value={hasData ? formatNumber(stats.rendimentoMedio) : '—'}
          unit={hasData ? 'kg/ha' : ''}
          hint="Média dos registros"
        />
        <Stat
          icon={<LuDollarSign size={20} />}
          label="Custo total"
          value={hasData ? formatBRL(stats.totalCustos) : '—'}
          hint="Somatório registrado"
        />
      </div>

      {/* Linha 3: gráfico + atividade recente */}
      <div className={styles.rowBottom}>
        <section className={`${styles.card} ${styles.chartCard}`} aria-label="Produtividade e custos">
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Produtividade e custos</h2>
            <div className={styles.segmented} role="tablist" aria-label="Modo do gráfico">
              {['mensal', 'acumulado'].map((mode) => (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={chartMode === mode}
                  className={`${styles.segBtn} ${chartMode === mode ? styles.segActive : ''}`}
                  onClick={() => setChartMode(mode)}
                >
                  {mode === 'mensal' ? 'Mensal' : 'Acumulado'}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 13 }}
                    iconType="circle"
                    formatter={(value) =>
                      value === 'rendimento' ? 'Produtividade (kg/ha)' : 'Custo (R$)'
                    }
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="rendimento"
                    name="rendimento"
                    fill={CHART_COLORS.bar}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="custo"
                    name="custo"
                    stroke={CHART_COLORS.line}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart onNavigate={onNavigate} />
          )}
        </section>

        <section className={`${styles.card} ${styles.recentCard}`} aria-label="Atividade recente">
          <h2 className={styles.cardTitle}>Atividade recente</h2>
          {recentActivity.length > 0 ? (
            <ul className={styles.timeline}>
              {recentActivity.map((item, i) => (
                <li key={item.id || i} className={styles.timelineItem}>
                  <span className={styles.timelineIcon} aria-hidden="true">
                    <LuFlaskConical size={16} />
                  </span>
                  <div className={styles.timelineBody}>
                    <span className={styles.timelineTitle}>
                      {item.tipo || 'Registro'}
                    </span>
                    <span className={styles.timelineMeta}>
                      {item.cultura ? `${item.cultura} · ` : ''}
                      {item.data || ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyInline}>
              <p>Nenhuma atividade ainda.</p>
              <button className={styles.linkBtn} onClick={() => onNavigate('meus-dados')}>
                Criar o primeiro registro <LuChevronRight size={15} />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/* ---------- Subcomponentes ---------- */

const Stat = ({ icon, label, value, unit, hint }) => (
  <div className={styles.stat}>
    <span className={styles.statIcon} aria-hidden="true">
      {icon}
    </span>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue}>
      <span className="tabular">{value}</span>
      {unit && <span className={styles.statUnit}>{unit}</span>}
    </span>
    {hint && <span className={styles.statHint}>{hint}</span>}
  </div>
);

const EmptyChart = ({ onNavigate }) => (
  <div className={styles.emptyChart}>
    <img
      src="/assets/illustrations/empty-field.svg"
      alt=""
      className={styles.emptyArt}
    />
    <strong>Ainda sem dados para o gráfico</strong>
    <p>Registre plantios, custos e colheitas para ver a evolução aqui.</p>
    <Button variant="secondary" size="sm" onClick={() => onNavigate('meus-dados')}>
      Criar registro
    </Button>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className={styles.tooltip}>
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span
            className={styles.tooltipDot}
            style={{ backgroundColor: p.color }}
            aria-hidden="true"
          />
          {p.dataKey === 'rendimento'
            ? `Produtividade: ${formatNumber(p.value)} kg/ha`
            : `Custo: ${formatBRL(p.value)}`}
        </div>
      ))}
    </div>
  );
};

/* ---------- Helpers ---------- */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatNumber(n) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(n || 0));
}

function formatBRL(n) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function recommendation(w) {
  if (!w) return 'Sem recomendação disponível.';
  if (w.windSpeed > 8) return 'Vento forte: evite pulverização hoje.';
  if (w.humidity > 85) return 'Umidade alta: monitore doenças fúngicas.';
  if (w.temp > 32) return 'Calor intenso: atenção ao estresse hídrico.';
  if (w.temp < 10) return 'Temperatura baixa: risco para culturas sensíveis.';
  return 'Boa janela para inspeção e manejo de campo.';
}

function parseDue(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function dueLabel(dateStr) {
  const due = parseDue(dateStr);
  if (!due) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return `Atrasada · ${formatDateBR(dateStr)}`;
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return formatDateBR(dateStr);
}

function dueClass(dateStr, styles) {
  const due = parseDue(dateStr);
  if (!due) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return styles.dueLate;
  if (diff <= 1) return styles.dueSoon;
  return '';
}

function formatDateBR(dateStr) {
  const due = parseDue(dateStr);
  if (!due) return dateStr;
  return due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default Dashboard;
