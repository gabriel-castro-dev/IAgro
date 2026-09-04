import React, { useMemo, useState } from 'react';
import { PDFController } from '../../controllers/PDFController';
import { Button, TextField, SelectField, StatusTag, Spinner } from '../ui';
import {
  LuDownload, LuArrowUpDown, LuChevronLeft, LuChevronRight, LuRotateCcw,
} from 'react-icons/lu';
import TarefasBoard from './TarefasBoard';
import styles from './Historico.module.css';

const PAGE_SIZE = 6;

const TIPO_TONE = (tipo = '') => {
  const t = tipo.toLowerCase();
  if (t.includes('plantio')) return 'green';
  if (t.includes('colheita')) return 'rust';
  if (t.includes('aduba')) return 'orange';
  if (t.includes('defensivo') || t.includes('aplica')) return 'orange';
  if (t.includes('irriga')) return 'blue';
  if (t.includes('praga') || t.includes('monitor')) return 'green';
  return 'neutral';
};

const Historico = ({ userId, userName = '', taskController, registros = [], loading = false, onNavigate }) => {
  const [tab, setTab] = useState('registros');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Histórico da propriedade</h1>
          <p className={styles.subtitle}>Consulte registros e acompanhe tarefas da operação.</p>
        </div>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label="Seções do histórico">
        <button role="tab" aria-selected={tab === 'registros'}
          className={`${styles.tab} ${tab === 'registros' ? styles.tabActive : ''}`} onClick={() => setTab('registros')}>
          Registros
        </button>
        <button role="tab" aria-selected={tab === 'tarefas'}
          className={`${styles.tab} ${tab === 'tarefas' ? styles.tabActive : ''}`} onClick={() => setTab('tarefas')}>
          Tarefas
        </button>
      </nav>

      {tab === 'registros' ? (
        <RegistrosTab registros={registros} loading={loading} userName={userName} onNavigate={onNavigate} />
      ) : (
        <TarefasBoard userId={userId} taskController={taskController} userName={userName} />
      )}
    </div>
  );
};

const RegistrosTab = ({ registros, loading, userName, onNavigate }) => {
  const [search, setSearch] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [cultura, setCultura] = useState('todas');
  const [sort, setSort] = useState({ field: 'data', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [exporting, setExporting] = useState(false);

  const culturas = useMemo(
    () => Array.from(new Set(registros.map((r) => r.cultura).filter(Boolean))),
    [registros]
  );
  const tipos = useMemo(
    () => Array.from(new Set(registros.map((r) => r.tipo).filter(Boolean))),
    [registros]
  );

  const filtered = useMemo(() => {
    let list = registros.filter((r) => {
      if (search && !`${r.cultura || ''} ${r.descricao || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (tipo !== 'todos' && r.tipo !== tipo) return false;
      if (cultura !== 'todas' && r.cultura !== cultura) return false;
      const d = toDate(r.data);
      if (de && d && d < new Date(de)) return false;
      if (ate && d && d > new Date(ate)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let av, bv;
      if (sort.field === 'data') { av = toDate(a.data)?.getTime() || 0; bv = toDate(b.data)?.getTime() || 0; }
      else { av = (a[sort.field] || '').toString().toLowerCase(); bv = (b[sort.field] || '').toString().toLowerCase(); }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [registros, search, de, ate, tipo, cultura, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const clearFilters = () => {
    setSearch(''); setDe(''); setAte(''); setTipo('todos'); setCultura('todas'); setPage(1);
  };
  const toggleSort = (field) => {
    setSort((s) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }));
  };
  const toggleSel = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleSelAll = () => {
    setSelected((prev) => {
      if (pageItems.every((i) => prev.has(i.id))) {
        const n = new Set(prev); pageItems.forEach((i) => n.delete(i.id)); return n;
      }
      const n = new Set(prev); pageItems.forEach((i) => n.add(i.id)); return n;
    });
  };
  const exportPdf = async (items) => {
    if (items.length === 0) return;
    setExporting(true);
    try { await new PDFController().exportProductivity(items, userName); }
    finally { setExporting(false); }
  };

  if (loading) return <div className={styles.loading}><Spinner label="Carregando histórico" /></div>;

  if (registros.length === 0) {
    return (
      <div className={styles.empty}>
        <img src="/assets/illustrations/empty-field.svg" alt="" className={styles.emptyArt} />
        <strong>Nenhum registro ainda</strong>
        <p>Crie um registro para começar a acompanhar o histórico.</p>
        <Button onClick={() => onNavigate('meus-dados')}>Novo registro</Button>
      </div>
    );
  }

  const selectedItems = registros.filter((r) => selected.has(r.id));

  return (
    <>
      <div className={styles.filterBar}>
        <TextField aria-label="Buscar" placeholder="Buscar por cultura ou descrição"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={styles.grow} />
        <TextField aria-label="Data inicial" type="date" value={de} onChange={(e) => { setDe(e.target.value); setPage(1); }} className={styles.date} />
        <TextField aria-label="Data final" type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPage(1); }} className={styles.date} />
        <SelectField aria-label="Tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }} className={styles.sel}
          options={[{ value: 'todos', label: 'Todos os tipos' }, ...tipos.map((t) => ({ value: t, label: t }))]} />
        <SelectField aria-label="Cultura" value={cultura} onChange={(e) => { setCultura(e.target.value); setPage(1); }} className={styles.sel}
          options={[{ value: 'todas', label: 'Todas as culturas' }, ...culturas.map((c) => ({ value: c, label: c }))]} />
        <button className={styles.clearBtn} onClick={clearFilters}>
          <LuRotateCcw size={16} /> Limpar filtros
        </button>
      </div>

      <div className={styles.countRow}>
        <span>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        <Button variant="secondary" size="sm" leftIcon={<LuDownload size={16} />} onClick={() => exportPdf(filtered)} loading={exporting} disabled={filtered.length === 0}>
          Exportar PDF
        </Button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkCol}>
                  <input type="checkbox" aria-label="Selecionar página"
                    checked={pageItems.length > 0 && pageItems.every((i) => selected.has(i.id))}
                    onChange={toggleSelAll} />
                </th>
                <SortTh label="Data" field="data" sort={sort} onSort={toggleSort} />
                <SortTh label="Tipo" field="tipo" sort={sort} onSort={toggleSort} />
                <SortTh label="Cultura" field="cultura" sort={sort} onSort={toggleSort} />
                <th>Talhão</th>
                <th>Descrição</th>
                <th>Responsável</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className={styles.row}>
                    <td className={styles.checkCol}>
                      <input type="checkbox" aria-label={`Selecionar ${r.cultura}`} checked={selected.has(r.id)} onChange={() => toggleSel(r.id)} />
                    </td>
                    <td className="tabular">{r.data}</td>
                    <td><StatusTag tone={TIPO_TONE(r.tipo)}>{r.tipo}</StatusTag></td>
                    <td>{r.cultura}</td>
                    <td>{r.dadosCompletos?.talhao || '—'}</td>
                    <td className={styles.descCell}>{r.descricao}</td>
                    <td>{userName || '—'}</td>
                    <td className={styles.actionsCol}>
                      <button className={styles.detailBtn} onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        aria-expanded={expanded === r.id}>
                        {expanded === r.id ? 'Ocultar' : 'Ver detalhes'}
                      </button>
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr className={styles.detailRow}>
                      <td colSpan={8}>
                        <DetailGrid item={r} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className={styles.mobileList}>
          {pageItems.map((r) => (
            <li key={r.id} className={styles.mCard}>
              <div className={styles.mTop}>
                <StatusTag tone={TIPO_TONE(r.tipo)}>{r.tipo}</StatusTag>
                <span className="tabular">{r.data}</span>
              </div>
              <strong>{r.cultura}{r.dadosCompletos?.talhao ? ` · ${r.dadosCompletos.talhao}` : ''}</strong>
              <p>{r.descricao}</p>
              <button className={styles.detailBtn} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                {expanded === r.id ? 'Ocultar detalhes' : 'Ver detalhes'}
              </button>
              {expanded === r.id && <DetailGrid item={r} />}
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <span className={styles.selInfo}>
            {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
            {selected.size > 0 && (
              <button className={styles.bulkBtn} onClick={() => exportPdf(selectedItems)}>Exportar selecionados</button>
            )}
          </span>
          <div className={styles.pager}>
            <span className={styles.pageInfo}>
              {filtered.length === 0 ? '0' : `${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)}`} de {filtered.length}
            </span>
            <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1} aria-label="Página anterior">
              <LuChevronLeft size={18} />
            </button>
            <span className={styles.pageNum}>{current}</span>
            <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages} aria-label="Próxima página">
              <LuChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const SortTh = ({ label, field, sort, onSort }) => (
  <th>
    <button className={styles.sortBtn} onClick={() => onSort(field)} aria-label={`Ordenar por ${label}`}>
      {label}
      <LuArrowUpDown size={13} className={sort.field === field ? styles.sortActive : ''} />
    </button>
  </th>
);

const DetailGrid = ({ item }) => {
  const d = item.dadosCompletos || {};
  const rows = [
    ['Data do plantio', fmtDate(d.dataPlantio)],
    ['Colheita prevista', fmtDate(d.dataColheita)],
    ['Tipo de solo', cap(d.tipoSolo)],
    ['Custos operacionais', d.custosOperacionais ? `R$ ${d.custosOperacionais}` : ''],
    ['Rendimento', d.rendimentoFinal ? `${d.rendimentoFinal} kg/ha` : ''],
    ['Adubação', d.dataTipoAdubacao],
    ['Defensivos', d.usoDefensivos],
    ['Pragas / doenças', d.ocorrenciaPragas],
    ['Irrigação', d.tipoIrrigacao],
    ['Observações', d.observacoes || d.perdasObservadas],
  ].filter(([, v]) => v);
  if (rows.length === 0) return <p className={styles.detailEmpty}>Sem detalhes adicionais.</p>;
  return (
    <dl className={styles.detailGrid}>
      {rows.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
};

/* helpers */
function toDate(br) {
  if (!br) return null;
  const [d, m, y] = br.split('/');
  if (!y) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
}
function fmtDate(s) { if (!s) return ''; if (s.includes('-')) { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; } return s; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

export default Historico;
