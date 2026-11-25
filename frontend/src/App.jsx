import React,{ useCallback, useEffect, useRef, useState } from 'react';
const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}
const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('mot_token') || '');
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('mot_user') || 'null'); } catch { return null; } });
  const [screen, setScreen] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(600);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [adminForm, setAdminForm] = useState({ text: '', subject: 'General Knowledge', options: ['', '', '', ''], correctAnswer: '0' });
  const submittedRef = useRef(false);

  const logout = () => { localStorage.removeItem('mot_token'); localStorage.removeItem('mot_user'); setToken(''); setUser(null); setAttempt(null); setScreen('home'); setNotice('You have been logged out.'); };
  const authenticate = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const data = await request(`/auth/${authMode === 'login' ? 'login' : 'signup'}`, { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('mot_token', data.token); localStorage.setItem('mot_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setScreen('home'); setNotice(`Welcome ${data.user.name}!`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const loadHistory = async () => { try { const data = await request('/tests/history/list', { token }); setHistory(data.attempts || []); setScreen('history'); } catch (err) { setError(err.message); } };
  const startTest = async () => {
    setError(''); setBusy(true); setNotice('');
    try {
      const data = await request('/tests/start', { token, method: 'POST', body: '{}' });
      setAttempt(data.attempt); setAnswers(data.attempt.answers || {}); setResult(null); submittedRef.current = false;
      setRemaining(Math.max(0, Math.ceil((new Date(data.attempt.endsAt).getTime() - Date.now()) / 1000)));
      setScreen('test');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const submitTest = useCallback(async (auto = false) => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true; setBusy(true); setError('');
    try {
      const data = await request(`/tests/${attempt.id}/submit`, { token, method: 'POST', body: JSON.stringify({ answers }) });
      setResult(data.result); setAttempt(data.attempt); setScreen('result');
      setNotice(auto || data.timeExpired ? 'Time is up. Your test was submitted automatically.' : 'Test submitted successfully.');
    } catch (err) { submittedRef.current = false; setError(err.message); }
    finally { setBusy(false); }
  }, [attempt, token, answers]);
  useEffect(() => {
    if (screen !== 'test' || !attempt) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((new Date(attempt.endsAt).getTime() - Date.now()) / 1000)));
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [screen, attempt]);
  useEffect(() => { if (screen === 'test' && remaining <= 0 && !submittedRef.current) submitTest(true); }, [remaining, screen, submitTest]);
  const chooseAnswer = async (questionId, index) => {
    setAnswers(prev => ({ ...prev, [questionId]: index }));
    try { await request(`/tests/${attempt.id}/answer`, { token, method: 'PUT', body: JSON.stringify({ questionId, selectedAnswer: index }) }); }
    catch (err) { setError(err.message); }
  };
  const viewAttempt = async id => {
    setError(''); setBusy(true);
    try { const data = await request(`/tests/${id}`, { token }); setAttempt(data.attempt); setResult(data.result || null); setAnswers(data.attempt.answers || {}); setScreen(data.result ? 'result' : 'test'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const loadAdmin = async () => {
    try { const data = await request('/admin/questions', { token }); setAdminQuestions(data.questions || []); setScreen('admin'); }
    catch (err) { setError(err.message); }
  };
  const addQuestion = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      await request('/admin/questions', { token, method: 'POST', body: JSON.stringify({ ...adminForm, correctAnswer: Number(adminForm.correctAnswer) }) });
      setAdminForm({ text: '', subject: 'General Knowledge', options: ['', '', '', ''], correctAnswer: '0' });
      setNotice('Question added.'); const data = await request('/admin/questions', { token }); setAdminQuestions(data.questions || []);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setScreen('home')}><span className="brand-mark">Q</span> quizly<span className="brand-dot">.</span></button>
      <nav>{token ? <><button className="nav-link" onClick={() => setScreen('home')}>Dashboard</button><button className="nav-link" onClick={loadHistory}>My history</button>{user?.role === 'admin' && <button className="nav-link" onClick={loadAdmin}>Admin</button>}<span className="user-pill">{user?.name}</span><button className="btn btn-outline btn-small" onClick={logout}>Log out</button></> : <button className="btn btn-outline btn-small" onClick={() => { setAuthMode('login'); setScreen('auth'); }}>Log in</button>}</nav>
    </header>
    <main className="main">
      {notice && <div className="notice">{notice}<button onClick={() => setNotice('')}>×</button></div>}
      {error && <div className="alert">{error}<button onClick={() => setError('')}>×</button></div>}
      {!token && screen !== 'auth' && <section className="hero"><div className="hero-copy"><span className="eyebrow">LEARN · PRACTICE · IMPROVE</span><h1>Test your knowledge.<br/><span>Beat your best.</span></h1><p>A focused 10-minute quiz to challenge what you know. Get instant results and track your progress over time.</p><button className="btn btn-primary" onClick={() => { setAuthMode('signup'); setScreen('auth'); }}>Create free account <span>→</span></button><div className="hero-meta"><span>✓ 10 curated questions</span><span>✓ Instant score</span></div></div><div className="hero-visual"><div className="floating-tag tag-top">✦ Your daily brain boost</div><div className="quiz-preview"><div className="preview-head"><span>QUICK QUIZ</span><span className="preview-time">◷ 10:00</span></div><div className="preview-progress"><i/></div><p className="preview-count">QUESTION 04 OF 10</p><h3>Which planet is known as the Red Planet?</h3>{['Venus','Mars','Jupiter','Mercury'].map((o,i)=><div className={`preview-option ${i===1?'chosen':''}`} key={o}><span>{String.fromCharCode(65+i)}</span>{o}{i===1&&<b>✓</b>}</div>)}<div className="preview-bottom"><span>4 of 10 answered</span><span className="preview-next">Next question →</span></div></div><div className="floating-tag tag-bottom"><span className="spark">✦</span> Keep growing, one quiz at a time</div></div></section>}
      {!token && screen === 'auth' && <section className="auth-layout"><div className="auth-side"><span className="eyebrow">YOUR NEXT PERSONAL BEST</span><h1>Small steps.<br/><span>Big progress.</span></h1><p>Build confidence with quick quizzes and a clear view of your progress.</p></div><form className="panel auth-card" onSubmit={authenticate}><span className="eyebrow">GET STARTED</span><h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="muted">{authMode === 'login' ? 'Log in to continue your learning journey.' : 'Join Quizly and start practicing today.'}</p>{authMode === 'signup' && <label>Full name<input name="name" placeholder="Your name" required minLength="2" autoComplete="name"/></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" required autoComplete="email"/></label><label>Password<input name="password" type="password" placeholder="At least 6 characters" required minLength="6" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}/></label><button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Log in' : 'Create account'}</button><p className="auth-switch">{authMode === 'login' ? 'New to Quizly?' : 'Already have an account?'} <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); }}>{authMode === 'login' ? 'Sign up' : 'Log in'}</button></p></form></section>}
      {token && screen === 'home' && <section className="dashboard"><div className="dash-heading"><div><span className="eyebrow">STUDENT DASHBOARD</span><h1>Hey, {user?.name?.split(' ')[0] || 'there'} <span>✦</span></h1><p className="muted">Ready to challenge yourself today?</p></div><div className="avatar">{user?.name?.[0]?.toUpperCase() || 'S'}</div></div><div className="dash-grid"><div className="panel test-card"><div className="card-icon">✎</div><span className="eyebrow">YOUR NEXT CHALLENGE</span><h2>General Knowledge<br/>Quick Test</h2><p>10 questions across different subjects. Take your time, think carefully, and do your best.</p><div className="test-stats"><span>◷ <b>10 min</b></span><span>☷ <b>10 questions</b></span><span>★ <b>10 points</b></span></div><button className="btn btn-primary" disabled={busy} onClick={startTest}>{busy ? 'Starting…' : 'Start test'} <span>→</span></button></div><div className="panel progress-card"><span className="eyebrow">YOUR JOURNEY</span><h2>Keep the streak going</h2><p className="muted">Every attempt is a step forward. Review your previous scores and keep improving.</p><div className="progress-art"><div className="progress-ring"><strong>10</strong><small>MINUTES</small></div><div className="art-star">✦</div><div className="art-line"/></div><button className="btn btn-outline" onClick={loadHistory}>View test history →</button></div></div><div className="tip-bar"><span className="tip-icon">✧</span><div><b>A little tip</b><p>Read each question carefully. You can move between questions before submitting your test.</p></div></div></section>}
      {token && screen === 'test' && attempt && <section className="test-screen"><div className="test-top"><div><span className="eyebrow">GENERAL KNOWLEDGE TEST</span><h1>Let's do this.</h1></div><div className={`timer ${remaining < 60 ? 'timer-danger' : ''}`}><span>◷</span><strong>{formatTime(remaining)}</strong><small>TIME LEFT</small></div></div><div className="test-layout"><aside className="panel question-nav"><span className="eyebrow">YOUR PROGRESS</span><h3>{Object.keys(answers).length} <span>/ 10</span></h3><div className="nav-grid">{attempt.questions.map((q,i)=><button key={q.id} className={`${i===0?'active':''} ${answers[q.id] !== undefined?'answered':''}`} onClick={() => document.getElementById(`question-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{i+1}</button>)}</div><p className="muted tiny">Green indicates answered questions.</p><div className="time-note">⏱ <span>Time is limited.<br/><b>Stay focused!</b></span></div></aside><div className="question-list">{attempt.questions.map((q,i)=><article className="panel question-card" id={`question-${i}`} key={q.id}><div className="question-heading"><span className="question-number">QUESTION {String(i+1).padStart(2,'0')}</span><span className="subject-tag">{q.subject || 'General'}</span></div><h2>{q.text}</h2><div className="answer-options">{q.options.map((option,index)=><button key={index} className={`answer-option ${answers[q.id] === index?'selected':''}`} onClick={() => chooseAnswer(q.id,index)}><span className="option-letter">{String.fromCharCode(65+index)}</span><span>{option}</span>{answers[q.id]===index&&<span className="selected-check">✓</span>}</button>)}</div></article>)}<div className="submit-row"><span className="muted">You have answered {Object.keys(answers).length} of 10 questions.</span><button className="btn btn-primary" disabled={busy} onClick={() => { if (window.confirm('Submit your test now? You cannot change answers after submission.')) submitTest(false); }}>{busy?'Submitting…':'Submit test →'}</button></div></div></div></section>}
      {token && screen === 'result' && result && <section className="result-screen"><div className="result-header"><span className="eyebrow">TEST COMPLETED</span><h1>Great effort, {user?.name?.split(' ')[0]}!</h1><p className="muted">Here is how you did. Review your answers and learn from every question.</p></div><div className="panel score-panel"><div className="score-circle"><strong>{result.score}<small>/{result.total}</small></strong><span>SCORE</span></div><div className="score-summary"><span className="eyebrow">YOUR RESULT</span><h2>{Math.round(result.score/result.total*100)}% <span>accuracy</span></h2><p><span className="correct-text">{result.score} correct</span> · <span className="wrong-text">{result.total-result.score} incorrect</span></p><button className="btn btn-primary" onClick={() => { setResult(null); setScreen('home'); }}>Back to dashboard</button></div></div><div className="review-heading"><div><span className="eyebrow">ANSWER REVIEW</span><h2>Learn from your answers</h2></div><button className="btn btn-outline btn-small" onClick={loadHistory}>View history</button></div><div className="review-list">{result.review.map(item=><article className="panel review-card" key={item.number}><div className="review-top"><span className="question-number">QUESTION {String(item.number).padStart(2,'0')}</span><span className={`review-status ${item.isCorrect?'is-correct':'is-wrong'}`}>{item.isCorrect?'✓ Correct':'× Incorrect'}</span></div><h3>{item.question}</h3><div className="review-answers">{item.options.map((option,index)=><div key={index} className={`review-option ${index===item.correctAnswer?'correct-option':''} ${index===item.selectedAnswer&&!item.isCorrect?'wrong-option':''}`}><span>{String.fromCharCode(65+index)}</span>{option}{index===item.correctAnswer&&<b>Correct answer</b>}{index===item.selectedAnswer&&!item.isCorrect&&<b>Your answer</b>}</div>)}</div></article>)}</div></section>}
      {token && screen === 'history' && <section className="history-screen"><span className="eyebrow">YOUR LEARNING JOURNEY</span><h1>Test history</h1><p className="muted">Every attempt helps you get better.</p><div className="panel history-panel">{history.length ? <div className="history-table"><div className="history-row history-head"><span>TEST</span><span>DATE</span><span>SCORE</span><span>RESULT</span></div>{history.map((item,index)=><div className="history-row" key={item._id}><span><b>Quick Test #{history.length-index}</b><small>10 questions</small></span><span>{new Date(item.submittedAt || item.createdAt).toLocaleString()}</span><span><b>{item.score}/{item.total}</b></span><span><button className="btn btn-outline btn-small" onClick={() => viewAttempt(item._id)}>Review →</button></span></div>)}</div> : <div className="empty-state"><div>☷</div><h3>No tests yet</h3><p>Your completed tests will appear here.</p><button className="btn btn-primary" onClick={startTest}>Take your first test →</button></div>}</div></section>}
      {token && screen === 'admin' && user?.role === 'admin' && <section className="admin-screen"><span className="eyebrow">ADMIN PANEL</span><h1>Manage questions</h1><p className="muted">Add multiple-choice questions to the test question bank.</p><div className="admin-layout"><form className="panel admin-form" onSubmit={addQuestion}><h2>Add a question</h2><label>Question text<input value={adminForm.text} required onChange={e=>setAdminForm({...adminForm,text:e.target.value})} placeholder="Enter your question"/></label><label>Subject<input value={adminForm.subject} onChange={e=>setAdminForm({...adminForm,subject:e.target.value})}/></label>{adminForm.options.map((o,i)=><label>Option {String.fromCharCode(65+i)}<input key={i} value={o} required onChange={e=>setAdminForm({...adminForm,options:adminForm.options.map((v,j)=>j===i?e.target.value:v)})} placeholder={`Enter option ${String.fromCharCode(65+i)}`}/></label>)}<label>Correct answer<select value={adminForm.correctAnswer} onChange={e=>setAdminForm({...adminForm,correctAnswer:e.target.value})}>{adminForm.options.map((o,i)=><option value={i} key={i}>{String.fromCharCode(65+i)} — {o || `Option ${String.fromCharCode(65+i)}`}</option>)}</select></label><button className="btn btn-primary" disabled={busy}>{busy?'Saving…':'Add question'}</button></form><div className="panel admin-list"><h2>Question bank <span>{adminQuestions.length}</span></h2>{adminQuestions.map((q,i)=><div className="admin-question" key={q._id}><b>{i+1}. {q.text}</b><small>{q.subject} · 4 options</small></div>)}</div></div></section>}
    </main><footer><span className="brand-mini">quizly<span>.</span></span><span>Make every minute count.</span><span>© {new Date().getFullYear()} Quizly</span></footer>
  </div>;
}
