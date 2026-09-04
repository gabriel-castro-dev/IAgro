import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../authContext';
import { ChatbotController } from '../../controllers/ChatbotController';
import { LuSparkles, LuX, LuSend, LuArrowUpRight, LuTrendingUp, LuDollarSign, LuDroplet } from 'react-icons/lu';
import styles from './Chatbot.module.css';

const QUICK_ACTIONS = [
  { icon: LuTrendingUp, label: 'Analisar produtividade', prompt: 'Analise minha produtividade recente e aponte melhorias.' },
  { icon: LuDollarSign, label: 'Revisar custos', prompt: 'Onde posso reduzir custos na minha produção?' },
  { icon: LuDroplet, label: 'Planejar irrigação', prompt: 'Como devo planejar a irrigação com o clima atual?' },
];

const Assistant = () => {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  const controller = useRef(new ChatbotController()).current;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && currentUser?.uid) {
      controller.loadChatHistory(currentUser.uid).then((res) => {
        if (res.success) setMessages(res.data);
      });
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, currentUser, controller]);

  // Esc fecha e devolve o foco ao trigger
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setFailed(null);
    const userMsg = { id: `u-${Date.now()}`, text: message, sender: 'user', timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await controller.sendMessage(currentUser.uid, message);
      if (res.success) {
        setMessages((m) => [...m, { id: `a-${Date.now()}`, text: res.data.response, sender: 'ai', timestamp: new Date(res.data.timestamp) }]);
      } else {
        setFailed(message);
        setMessages((m) => [...m, { id: `e-${Date.now()}`, text: res.error || 'Não foi possível responder agora.', sender: 'ai', isError: true, timestamp: new Date() }]);
      }
    } catch (err) {
      setFailed(message);
      setMessages((m) => [...m, { id: `e-${Date.now()}`, text: 'Erro ao processar. Tente novamente.', sender: 'ai', isError: true, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="Abrir assistente"
        aria-expanded={open}
      >
        <LuSparkles size={22} aria-hidden="true" />
        <span className={styles.triggerLabel}>Assistente</span>
      </button>

      {open && (
        <div className={styles.overlay}>
          <div className={styles.backdrop} onClick={close} aria-hidden="true" />
          <aside className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="assistant-title">
            <header className={styles.head}>
              <div className={styles.headInfo}>
                <span className={styles.headIcon} aria-hidden="true"><LuSparkles size={20} /></span>
                <div>
                  <h2 id="assistant-title" className={styles.headTitle}>Assistente agronômico</h2>
                  <span className={styles.status}>{loading ? 'Digitando…' : 'Disponível'}</span>
                </div>
              </div>
              <button className={styles.close} onClick={close} aria-label="Fechar assistente"><LuX size={20} /></button>
            </header>

            <div className={styles.context}>Usando dados da sua propriedade</div>

            <div className={styles.messages} aria-live="polite">
              {messages.length === 0 && !loading && (
                <div className={styles.welcome}>
                  <p>Bom dia. Posso analisar seus registros, clima e tarefas da propriedade.</p>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={`${styles.msg} ${m.sender === 'user' ? styles.msgUser : styles.msgAi} ${m.isError ? styles.msgError : ''}`}>
                  {m.text}
                </div>
              ))}

              {loading && (
                <div className={`${styles.msg} ${styles.msgAi}`}>
                  <span className={styles.typing}><span /><span /><span /></span>
                </div>
              )}

              {failed && !loading && (
                <button className={styles.retry} onClick={() => send(failed)}>Tentar novamente</button>
              )}

              <div ref={endRef} />
            </div>

            {messages.length === 0 && (
              <div className={styles.quick}>
                <span className={styles.quickTitle}>Ações rápidas</span>
                {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                  <button key={label} className={styles.quickBtn} onClick={() => send(prompt)}>
                    <Icon size={18} aria-hidden="true" />
                    <span>{label}</span>
                    <LuArrowUpRight size={16} className={styles.quickArrow} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}

            <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
              <textarea
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Pergunte sobre sua propriedade"
                rows={1}
                aria-label="Mensagem para o assistente"
              />
              <button type="submit" className={styles.sendBtn} disabled={!input.trim() || loading} aria-label="Enviar">
                <LuSend size={18} />
              </button>
            </form>
            <p className={styles.disclaimer}>Confirme decisões críticas com um profissional habilitado.</p>
          </aside>
        </div>
      )}
    </>
  );
};

export default Assistant;
