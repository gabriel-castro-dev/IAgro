import React, { useEffect, useMemo, useState } from 'react';
import { PDFController } from '../../controllers/PDFController';
import { Button, TextField, SelectField, StatusTag, Drawer, Spinner, InlineAlert } from '../ui';
import {
  LuPlus, LuDownload, LuClipboardList, LuCalendar, LuClock, LuCircleCheck,
  LuCheck, LuTrash2, LuFlag, LuColumns3, LuList,
} from 'react-icons/lu';
import styles from './TarefasBoard.module.css';

const PRIORITIES = {
  alta: { label: 'Alta', tone: 'rust' },
  media: { label: 'Média', tone: 'orange' },
  baixa: { label: 'Baixa', tone: 'green' },
};
const COLUMNS = [
  { key: 'todo', label: 'A fazer' },
  { key: 'late', label: 'Em atraso' },
  { key: 'done', label: 'Concluídas' },
];

const TarefasBoard = ({ userId, taskController, userName }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [prioFilter, setPrioFilter] = useState('todas');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    if (!userId) return setLoading(false);
    setLoading(true);
    const res = await taskController.getTasks(userId);
    setTasks(res.success ? res.data : []);
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [userId]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !`${t.titulo} ${t.descricao || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter === 'pendentes' && t.concluida) return false;
      if (statusFilter === 'concluidas' && !t.concluida) return false;
      if (prioFilter !== 'todas' && (t.prioridade || 'media') !== prioFilter) return false;
      return true;
    });
  }, [tasks, search, statusFilter, prioFilter]);

  const counts = useMemo(() => {
    const today = todayStr();
    return {
      total: tasks.length,
      hoje: tasks.filter((t) => !t.concluida && t.dataLimite === today).length,
      atraso: tasks.filter((t) => !t.concluida && t.dataLimite < today).length,
      concluidas: tasks.filter((t) => t.concluida).length,
    };
  }, [tasks]);

  const byColumn = (key) => filtered.filter((t) => statusOf(t) === key);

  const toggle = async (t) => {
    await taskController.toggleTask(t.id, !t.concluida);
    load();
  };
  const remove = async (t) => {
    if (!window.confirm(`Excluir a tarefa "${t.titulo}"?`)) return;
    await taskController.removeTask(t.id);
    load();
  };
  const create = async (data) => {
    const res = await taskController.createTask(userId, data);
    if (res.success) {
      setDrawerOpen(false);
      load();
    }
    return res;
  };
  const exportPdf = async () => {
    setExporting(true);
    try {
      await new PDFController().exportTasks(tasks, userName);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <TextField
          aria-label="Buscar tarefa"
          placeholder="Buscar tarefa"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <SelectField
          aria-label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'todas', label: 'Todas' },
            { value: 'pendentes', label: 'Pendentes' },
            { value: 'concluidas', label: 'Concluídas' },
          ]}
          className={styles.filter}
        />
        <SelectField
          aria-label="Prioridade"
          value={prioFilter}
          onChange={(e) => setPrioFilter(e.target.value)}
          options={[
            { value: 'todas', label: 'Todas as prioridades' },
            { value: 'alta', label: 'Alta' },
            { value: 'media', label: 'Média' },
            { value: 'baixa', label: 'Baixa' },
          ]}
          className={styles.filter}
        />
        <div className={styles.viewToggle} role="group" aria-label="Visualização">
          <button className={`${styles.viewBtn} ${view === 'kanban' ? styles.viewOn : ''}`}
            onClick={() => setView('kanban')} aria-pressed={view === 'kanban'} aria-label="Quadro">
            <LuColumns3 size={18} />
          </button>
          <button className={`${styles.viewBtn} ${view === 'list' ? styles.viewOn : ''}`}
            onClick={() => setView('list')} aria-pressed={view === 'list'} aria-label="Lista">
            <LuList size={18} />
          </button>
        </div>
        <Button variant="secondary" leftIcon={<LuDownload size={18} />} onClick={exportPdf} loading={exporting} disabled={tasks.length === 0}>
          Exportar
        </Button>
        <Button leftIcon={<LuPlus size={18} />} onClick={() => setDrawerOpen(true)}>Nova tarefa</Button>
      </div>

      <div className={styles.chips}>
        <Chip icon={<LuClipboardList size={18} />} value={counts.total} label="tarefas" />
        <Chip icon={<LuCalendar size={18} />} value={counts.hoje} label="para hoje" tone="brass" />
        <Chip icon={<LuClock size={18} />} value={counts.atraso} label="em atraso" tone="rust" />
        <Chip icon={<LuCircleCheck size={18} />} value={counts.concluidas} label="concluídas" tone="green" />
      </div>

      {loading ? (
        <div className={styles.loading}><Spinner label="Carregando tarefas" /></div>
      ) : tasks.length === 0 ? (
        <EmptyTasks onCreate={() => setDrawerOpen(true)} />
      ) : view === 'kanban' ? (
        <div className={styles.columns}>
          {COLUMNS.map((col) => {
            const items = byColumn(col.key);
            return (
              <section key={col.key} className={styles.column} aria-label={col.label}>
                <header className={styles.columnHead}>
                  {col.label} <span className={styles.columnCount}>· {items.length}</span>
                </header>
                <div className={styles.cards}>
                  {items.map((t) => <TaskCard key={t.id} task={t} onToggle={toggle} onRemove={remove} />)}
                  {items.length === 0 && <p className={styles.columnEmpty}>Nada aqui.</p>}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className={styles.list}>
          {COLUMNS.map((col) => {
            const items = byColumn(col.key);
            if (items.length === 0) return null;
            return (
              <section key={col.key} className={styles.listGroup}>
                <h3 className={styles.listGroupTitle}>{col.label} · {items.length}</h3>
                {items.map((t) => <TaskRow key={t.id} task={t} onToggle={toggle} onRemove={remove} />)}
              </section>
            );
          })}
        </div>
      )}

      <NovaTarefaDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onCreate={create} />
    </div>
  );
};

/* ---------- Cards / rows ---------- */
const TaskCard = ({ task, onToggle, onRemove }) => {
  const prio = PRIORITIES[task.prioridade] || PRIORITIES.media;
  return (
    <article className={`${styles.card} ${task.concluida ? styles.cardDone : ''}`}>
      <div className={styles.cardTop}>
        <h4 className={styles.cardTitle}>{task.titulo}</h4>
        <button className={styles.cardCheck} onClick={() => onToggle(task)}
          aria-pressed={task.concluida} aria-label={task.concluida ? 'Reabrir tarefa' : 'Concluir tarefa'}>
          <LuCheck size={16} />
        </button>
      </div>
      {task.descricao && <p className={styles.cardDesc}>{task.descricao}</p>}
      <div className={styles.cardMeta}>
        <StatusTag tone={dueTone(task)} dot={false} icon={<LuCalendar size={14} />}>{dueLabel(task.dataLimite)}</StatusTag>
        <StatusTag tone={prio.tone} dot={false} icon={<LuFlag size={14} />}>{prio.label}</StatusTag>
      </div>
      <div className={styles.cardFoot}>
        <span className={styles.cardCat}>{task.categoria || 'Geral'}</span>
        <button className={styles.cardDelete} onClick={() => onRemove(task)} aria-label="Excluir tarefa">
          <LuTrash2 size={16} />
        </button>
      </div>
    </article>
  );
};

const TaskRow = ({ task, onToggle, onRemove }) => {
  const prio = PRIORITIES[task.prioridade] || PRIORITIES.media;
  return (
    <div className={`${styles.row} ${task.concluida ? styles.rowDone : ''}`}>
      <button className={styles.rowCheck} onClick={() => onToggle(task)}
        aria-pressed={task.concluida} aria-label={task.concluida ? 'Reabrir' : 'Concluir'}>
        <LuCheck size={14} />
      </button>
      <span className={styles.rowTitle}>{task.titulo}</span>
      <StatusTag tone={dueTone(task)} dot={false}>{dueLabel(task.dataLimite)}</StatusTag>
      <StatusTag tone={prio.tone} dot={false}>{prio.label}</StatusTag>
      <span className={styles.rowCat}>{task.categoria || 'Geral'}</span>
      <button className={styles.cardDelete} onClick={() => onRemove(task)} aria-label="Excluir tarefa">
        <LuTrash2 size={16} />
      </button>
    </div>
  );
};

const Chip = ({ icon, value, label, tone = 'neutral' }) => (
  <div className={`${styles.chip} ${styles[`chip_${tone}`] || ''}`}>
    <span className={styles.chipIcon} aria-hidden="true">{icon}</span>
    <span className={styles.chipValue}>{value}</span>
    <span className={styles.chipLabel}>{label}</span>
  </div>
);

const EmptyTasks = ({ onCreate }) => (
  <div className={styles.emptyState}>
    <img src="/assets/illustrations/empty-field.svg" alt="" className={styles.emptyArt} />
    <strong>Nenhuma tarefa ainda</strong>
    <p>Crie tarefas para organizar as atividades da propriedade.</p>
    <Button leftIcon={<LuPlus size={18} />} onClick={onCreate}>Nova tarefa</Button>
  </div>
);

/* ---------- Drawer de criação ---------- */
const NovaTarefaDrawer = ({ open, onClose, onCreate }) => {
  const [f, setF] = useState({ titulo: '', dataLimite: '', categoria: '', prioridade: 'media', descricao: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setF({ titulo: '', dataLimite: '', categoria: '', prioridade: 'media', descricao: '' }); setError(''); }
  }, [open]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    setError('');
    if (!f.titulo.trim() || !f.dataLimite) {
      setError('Informe ao menos título e data limite.');
      return;
    }
    setSaving(true);
    const res = await onCreate({
      titulo: f.titulo.trim(),
      dataLimite: f.dataLimite,
      categoria: f.categoria.trim() || 'Geral',
      prioridade: f.prioridade,
      descricao: f.descricao.trim(),
    });
    setSaving(false);
    if (res && res.success === false) setError(res.error || 'Não foi possível criar a tarefa.');
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nova tarefa"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} loading={saving}>Criar tarefa</Button>
        </>
      }
    >
      <div className={styles.form}>
        <TextField label="Título" required value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Digite o título da tarefa" />
        <TextField label="Data limite" type="date" required value={f.dataLimite} onChange={(e) => set('dataLimite', e.target.value)} />
        <TextField label="Categoria" value={f.categoria} onChange={(e) => set('categoria', e.target.value)} placeholder="Ex.: Sanidade vegetal" />
        <SelectField label="Prioridade" value={f.prioridade} onChange={(e) => set('prioridade', e.target.value)}
          options={[{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Média' }, { value: 'baixa', label: 'Baixa' }]} />
        <TextField label="Descrição" multiline rows={4} value={f.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Descreva os detalhes da tarefa" />
        {error && <InlineAlert variant="error">{error}</InlineAlert>}
      </div>
    </Drawer>
  );
};

/* ---------- Helpers ---------- */
function todayStr() { return new Date().toISOString().split('T')[0]; }
function statusOf(t) {
  if (t.concluida) return 'done';
  if (t.dataLimite && t.dataLimite < todayStr()) return 'late';
  return 'todo';
}
function parseDue(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y) return null;
  return new Date(y, m - 1, d);
}
function dueLabel(s) {
  const due = parseDue(s);
  if (!due) return 'Sem data';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return `Atrasada · ${fmt(s)}`;
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return fmt(s);
}
function dueTone(t) {
  if (t.concluida) return 'neutral';
  const due = parseDue(t.dataLimite);
  if (!due) return 'neutral';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return 'danger';
  if (diff <= 1) return 'brass';
  return 'neutral';
}
function fmt(s) {
  const due = parseDue(s);
  if (!due) return s;
  return due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default TarefasBoard;
