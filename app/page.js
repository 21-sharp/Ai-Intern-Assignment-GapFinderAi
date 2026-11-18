'use client';

import { useEffect, useMemo, useState } from 'react';

const initials = (name) => (name || 'S').trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
const sampleMaterial = `BIOLOGY — SAMPLE REVISION NOTES\n\n1. Cell structure (Chapter 2, Section 1)\nThe cell membrane is selectively permeable and regulates movement of substances. The nucleus contains DNA and controls cell activities. Mitochondria are the site of aerobic respiration and release energy as ATP. Ribosomes synthesize proteins.\n\n2. Photosynthesis (Chapter 4, Section 2)\nPhotosynthesis converts light energy into chemical energy in chloroplasts. Chlorophyll absorbs light. The light-dependent reactions split water, release oxygen, and produce ATP and NADPH. The Calvin cycle fixes carbon dioxide into glucose using ATP and NADPH.\n\n3. Cellular respiration (Chapter 5, Section 1)\nAerobic respiration breaks down glucose in the presence of oxygen to release ATP. Glycolysis occurs in the cytoplasm and produces pyruvate. The Krebs cycle and electron transport chain occur in mitochondria.\n\nSYLLABUS\nCell structure; photosynthesis; cellular respiration`;
const sampleMaterials = {
  Biology: sampleMaterial,
  Chemistry: `CHEMISTRY — SAMPLE REVISION NOTES\n\n1. Atomic structure (Chapter 1, Section 1)\nAtoms contain protons and neutrons in a central nucleus, with electrons occupying energy levels around it. The atomic number equals the number of protons. Isotopes have the same number of protons but different numbers of neutrons.\n\n2. Chemical bonding (Chapter 3, Section 2)\nIonic bonding forms when electrons transfer from one atom to another, creating oppositely charged ions. Covalent bonding forms when atoms share pairs of electrons. Metallic bonding consists of positive ions surrounded by delocalized electrons.\n\nSYLLABUS\nAtomic structure; chemical bonding`,
  Physics: `PHYSICS — SAMPLE REVISION NOTES\n\n1. Waves (Chapter 4, Section 1)\nA wave transfers energy without transferring matter overall. Frequency is the number of complete oscillations each second. Wave speed equals frequency multiplied by wavelength. Transverse waves oscillate perpendicular to the direction of travel.\n\n2. Electric circuits (Chapter 6, Section 2)\nCurrent is the rate of flow of charge. Potential difference is the energy transferred per unit charge. In a series circuit, the current is the same through each component. Resistance equals potential difference divided by current.\n\nSYLLABUS\nWaves; electric circuits`
};
const sampleStudents = [
  { name: 'Maya Patel', email: 'maya.patel@example.edu', grade: 'Grade 12', subject: 'Biology', mastery: 82, diagnostics: 6, lastActive: 'Today', strengths: 'Cell structure, Genetics', focus: 'Photosynthesis' },
  { name: 'Noah Williams', email: 'noah.williams@example.edu', grade: 'Grade 11', subject: 'Chemistry', mastery: 64, diagnostics: 4, lastActive: 'Yesterday', strengths: 'Atomic structure', focus: 'Chemical bonding' },
  { name: 'Aisha Khan', email: 'aisha.khan@example.edu', grade: 'Grade 12', subject: 'Physics', mastery: 47, diagnostics: 3, lastActive: 'Nov 16', strengths: 'Waves', focus: 'Electric circuits' }
];

export default function Home() {
  const [name, setName] = useState('Student');
  const [material, setMaterial] = useState('');
  const [sourceName, setSourceName] = useState('No material added');
  const [topics, setTopics] = useState([]);
  const [answers, setAnswers] = useState({});
  const [report, setReport] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [days, setDays] = useState(5);
  const [hours, setHours] = useState(2);
  const [active, setActive] = useState('Overview');
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { cache: 'no-store' }).then(async response => response.ok ? (await response.json()).user : null).catch(() => null).then(user => {
      if (!alive) return;
      if (user) enterWorkspace(user);
      else setAuthReady(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (loaded && authUser) localStorage.setItem(`gapfinder-state-${authUser.id}`, JSON.stringify({ name, material, sourceName, topics, quiz, attempts, report, chat }));
  }, [name, material, sourceName, topics, quiz, attempts, report, chat, loaded, authUser]);

  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json()).then(data => setAdmin(Boolean(data.isAdmin))).catch(() => {}).finally(() => setAdminChecked(true));
  }, []);

  const scores = useMemo(() => report?.topics || topics.map(topic => ({ topic, correct: 0, total: 0, score: null, level: 'untested', reason: 'Take a diagnostic to measure this topic.' })), [report, topics]);
  const overall = report?.overall ?? (attempts.length ? attempts.at(-1).score : null);
  const weakCount = scores.filter(x => x.level === 'weak').length;

  function enterWorkspace(user, destination = 'Overview') {
    setAuthUser(user); setName(user.name || 'Student');
    if (user.role === 'admin') setAdmin(true);
    const initial = { material: '', sourceName: 'No material added', topics: [], quiz: [], attempts: [], report: null, chat: [] };
    try {
      const saved = JSON.parse(localStorage.getItem(`gapfinder-state-${user.id}`) || '{}');
      setMaterial(saved.material ?? initial.material); setSourceName(saved.sourceName ?? initial.sourceName); setTopics(saved.topics ?? initial.topics); setQuiz(saved.quiz ?? initial.quiz);
      setAttempts(saved.attempts ?? initial.attempts); setReport(saved.report ?? initial.report); setChat(saved.chat ?? initial.chat);
    } catch {
      setMaterial(initial.material); setSourceName(initial.sourceName); setTopics(initial.topics); setQuiz(initial.quiz); setAttempts(initial.attempts); setReport(initial.report); setChat(initial.chat);
    }
    setAnswers({}); setActive(destination); setLoaded(true); setAuthReady(true);
  }

  async function signOut() {
    try {
      if (authUser?.role === 'admin') await fetch('/api/admin/session', { method: 'DELETE' });
      else await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* The local sign-in view is still safe to show. */ }
    setLoaded(false); setAuthUser(null); setAuthReady(true); setActive('Overview');
  }

  async function adminLogin(e) {
    e.preventDefault(); setAdminBusy(true); setAdminError('');
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: adminEmail, password: adminPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign-in failed.');
      setAdmin(true); setAdminPassword('');
    } catch (error) { setAdminError(error.message || 'Could not sign in.'); }
    finally { setAdminBusy(false); }
  }

  function loadSampleWorkspace(student = null) {
    const subject = student?.subject || 'Biology';
    const example = sampleMaterials[subject] || sampleMaterial;
    if ((material.trim() || attempts.length) && !window.confirm('Replace this workspace’s material and diagnostic history with the sample notes?')) return;
    const mapped = buildTopicMap(example);
    setMaterial(example); setSourceName(`${subject} sample notes.txt`); setTopics(mapped); setQuiz(questionsFromMaterial(example, mapped)); setAnswers({}); setReport(null); setAttempts([]); setChat([]); setActive('Materials'); setWorkspaceMenuOpen(false);
    setNotice(`${subject} sample notes loaded. Your personal name and profile are unchanged.`); setTimeout(() => setNotice(''), 3500);
  }

  function buildTopicMap(text) {
    const headers = [...text.matchAll(/^\s*(?:\d+[.)]\s*)?([A-Z][^\n]{2,70})\s*\((?:Chapter|Section)[^\n]*\)/gm)].map(m => m[1].trim().replace(/[:—-]+$/, ''));
    const syllabusLine = text.split('\n').find(l => /^SYLLABUS\b/i.test(l));
    const parsed = syllabusLine ? syllabusLine.replace(/^SYLLABUS\s*:*/i, '').split(/[;\n,]/).map(s => s.trim()).filter(s => s.length > 2) : [];
    const unique = [...new Set([...headers, ...parsed])];
    if (!unique.length && text.trim()) return [...new Set(text.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 65))].slice(0, 8);
    return unique.slice(0, 12);
  }

  function questionsFromMaterial(text, topicList) {
    const blocks = text.split(/\n\s*\n/).filter(Boolean);
    const generated = topicList.map(topic => {
      const block = blocks.find(part => part.toLowerCase().includes(topic.toLowerCase()));
      if (!block) return null;
      const sentence = block.replace(/^\s*\d+[.)]\s*/, '').split(/(?<=[.!?])\s+/).find(s => s.length > 35 && !/^SYLLABUS/i.test(s));
      if (!sentence) return null;
      const citation = block.match(/\((Chapter|Section)[^)]*\)/i)?.[0]?.replace(/[()]/g, '') || sourceName;
      const stop = ['which','where','their','there','about','these','those','using','during','through','because','from','with','that','this','into','only','have','been','they','them','will','does','also','after','before','when','what','most','each'];
      const keywords = [...new Set(sentence.toLowerCase().match(/[a-z]{4,}/g) || [])].filter(word => !stop.includes(word)).slice(0, 6);
      return keywords.length ? { topic, prompt: `Explain the key concept covered in your notes about ${topic}. Include the main process or idea and its outcome.`, answer: sentence, cite: citation, keywords } : null;
    }).filter(Boolean);
    return generated.slice(0, 8);
  }

  async function handleUpload(file) {
    if (!file) return;
    if (file.type === 'application/pdf') {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), useWorkerFetch: false, isEvalSupported: false }).promise;
        const pages = [];
        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
          const page = await pdf.getPage(pageNo);
          const content = await page.getTextContent();
          pages.push(`Page ${pageNo}\n${content.items.map(item => item.str).join(' ')}`);
        }
        const text = pages.join('\n\n'); const mapped = buildTopicMap(text);
        setMaterial(text); setSourceName(file.name); setTopics(mapped); setQuiz(questionsFromMaterial(text, mapped)); setReport(null); setAnswers({});
        setNotice(`Extracted ${pdf.numPages} pages from ${file.name}. Review and edit the text before your diagnostic.`);
      } catch { setNotice('Could not extract text from this PDF. Try a text based PDF or paste its contents into the editor.'); }
      setTimeout(() => setNotice(''), 5000); return;
    }
    const text = await file.text();
    const mapped = buildTopicMap(text);
    setMaterial(text); setSourceName(file.name); setTopics(mapped); setQuiz(questionsFromMaterial(text, mapped)); setReport(null); setAnswers({});
    setNotice(`Indexed ${file.name} and mapped ${buildTopicMap(text).length} topics.`); setTimeout(() => setNotice(''), 4000);
  }

  function evaluateAnswer(answer, q) {
    const normalized = answer.toLowerCase();
    const matched = q.keywords.filter(k => normalized.includes(k)).length;
    const ratio = matched / q.keywords.length;
    return { correct: ratio >= 0.5, feedback: ratio >= 0.5 ? `Good recall. Your answer matches the source’s key ideas: ${q.answer}` : `Not quite. The source says: ${q.answer}` };
  }

  async function submitQuiz() {
    if (!quiz.length) { setNotice('Add study material and update your topic map to create diagnostic questions.'); setTimeout(() => setNotice(''), 3500); return; }
    if (quiz.some((_, i) => !answers[i]?.trim())) { setNotice('Answer every question before submitting your diagnosis.'); setTimeout(() => setNotice(''), 3000); return; }
    setBusy(true);
    const result = quiz.map((q, i) => ({ ...q, ...evaluateAnswer(answers[i], q) }));
    const calculated = topics.map(topic => {
      const subset = result.filter(q => q.topic.toLowerCase() === topic.toLowerCase() || topic.toLowerCase().includes(q.topic.toLowerCase()) || q.topic.toLowerCase().includes(topic.toLowerCase()));
      const correct = subset.filter(q => q.correct).length; const total = subset.length;
      const score = total ? Math.round(correct / total * 100) : null;
      const level = score === null ? 'untested' : score < 50 ? 'weak' : score < 80 ? 'medium' : 'strong';
      return { topic, correct, total, score, level, reason: total ? `${correct} of ${total} questions correct. ${subset.filter(q => !q.correct).map(q => q.prompt.toLowerCase()).join('; ') || 'You showed strong recall across the tested ideas.'}` : 'No question matched this topic yet.' };
    });
    const totalCorrect = result.filter(q => q.correct).length;
    const summary = { overall: Math.round(totalCorrect / result.length * 100), topics: calculated, responses: result, date: new Date().toISOString() };
    setReport(summary); setAttempts(prev => [...prev, { date: summary.date, score: summary.overall, topicScores: Object.fromEntries(calculated.filter(x => x.score !== null).map(x => [x.topic, x.score])) }]);
    setBusy(false); setActive('Diagnosis');
  }

  async function askAssistant(e) {
    e.preventDefault(); if (!chatInput.trim()) return;
    const question = chatInput.trim(); const next = [...chat, { role: 'user', text: question }]; setChat(next); setChatInput(''); setBusy(true);
    try {
      const response = await fetch('/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, material }) });
      const data = await response.json(); setChat([...next, { role: 'assistant', text: data.answer || 'I could not find relevant information in the material.', cite: data.citation }]);
    } catch { setChat([...next, { role: 'assistant', text: localGroundedAnswer(question), cite: 'Retrieved from your uploaded material' }]); }
    setBusy(false);
  }

  function localGroundedAnswer(question) {
    const terms = question.toLowerCase().split(/\W+/).filter(x => x.length > 3);
    const chunks = material.split(/\n\s*\n/).filter(Boolean);
    const best = chunks.map(chunk => ({ chunk, score: terms.filter(t => chunk.toLowerCase().includes(t)).length })).sort((a, b) => b.score - a.score)[0];
    if (!best?.score) return 'I could not find an answer to that in your uploaded material. Add a relevant note or ask about a topic in your source.';
    const cite = best.chunk.match(/\((Chapter|Section)[^)]*\)/i)?.[0]?.replace(/[()]/g, '') || sourceName;
    return best.chunk.replace(/^\s*\d+[.)]\s*/, '').slice(0, 700) + (best.chunk.length > 700 ? '…' : '') + `\n\nThis answer is based only on your uploaded material.`;
  }

  const planItems = [...scores].filter(x => x.level !== 'untested').sort((a, b) => (a.score ?? 100) - (b.score ?? 100)).map((x, i) => ({ ...x, minutes: Math.max(20, Math.round((days * hours * 60 / Math.max(1, scores.filter(s => s.level !== 'untested').length)) * (x.level === 'weak' ? 1.5 : x.level === 'medium' ? 1.1 : .65))) }));
  const tabs = ['Overview', 'Materials', 'Diagnostic', 'Diagnosis', 'Study plan', 'Ask your material', 'Student examples'];

  if (!authReady || (authUser && !loaded)) return <main className="auth-shell" aria-label="Loading your account"><div className="auth-loading">Loading your study space…</div></main>;
  if (!authUser) return <AuthScreen onAuth={enterWorkspace}/>;

  return <main className="shell">
    <aside className="sidebar"><button className="brand brand-home" onClick={() => { setActive('Overview'); setAccountMenuOpen(false); }} aria-label="GapFinder home"><span className="brand-mark">g.</span><span><b>gapfinder</b><small>STUDY INTELLIGENCE</small></span></button>
      <div className="workspace-label">WORKSPACE</div><div className="workspace-switcher"><button className="subject" onClick={() => setWorkspaceMenuOpen(open => !open)} aria-expanded={workspaceMenuOpen} aria-haspopup="true" aria-controls="workspace-menu" title="Open workspace menu"><span className="subject-icon">{sourceName === 'No material added' ? '+' : sourceName.slice(0, 1).toUpperCase()}</span><span><b>{sourceName === 'No material added' ? 'Your workspace' : sourceName}</b><small>{topics.length} topics mapped</small></span><span className="chevron">⌄</span></button>{workspaceMenuOpen && <div className="workspace-menu" id="workspace-menu"><button onClick={() => { setActive('Overview'); setWorkspaceMenuOpen(false); }}>Overview</button><button onClick={() => { setActive('Materials'); setWorkspaceMenuOpen(false); }}>Study materials</button><button onClick={() => loadSampleWorkspace()}>Load Biology sample notes</button></div>}</div>
      <div className="nav-label">YOUR STUDY SPACE</div><nav>{tabs.map((tab, i) => <button key={tab} title={tab} aria-label={tab} onClick={() => { setActive(tab); setWorkspaceMenuOpen(false); }} className={`nav-item ${active === tab ? 'selected' : ''}`}><span className="nav-icon">{['◫','▤','✳','◉','↗','⌕','♙'][i]}</span>{tab}{tab === 'Diagnosis' && weakCount > 0 && <span className="nav-badge">{weakCount}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="streak"><span className="streak-fire">✦</span><div><b>{attempts.length ? `${attempts.length} diagnostic${attempts.length > 1 ? 's' : ''}` : 'Start your streak'}</b><small>Small steps add up.</small></div></div><div className="profile-menu-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAccountMenuOpen(false); }}><button className="profile profile-toggle" onClick={() => setAccountMenuOpen(open => !open)} aria-expanded={accountMenuOpen} aria-haspopup="menu" aria-label="Account options"><span className="avatar">{initials(name)}</span><span className="profile-copy"><b>{name}</b><small>{authUser.role === 'admin' ? 'Administrator' : authUser.role === 'teacher' ? 'Teacher account' : 'Student account'}</small></span><span className="more" aria-hidden="true">⌄</span></button>{accountMenuOpen && <div className="account-menu" role="menu"><div className="account-menu-heading"><b>Signed in as</b><small>{authUser.role === 'admin' ? 'Administrator' : authUser.role === 'teacher' ? 'Teacher' : 'Student'}</small></div><div className="account-detail"><span>Name</span><b>{authUser.name || name}</b></div><div className="account-detail"><span>Email</span><b title={authUser.email || 'Local demo account'}>{authUser.email || 'Local demo account'}</b></div><button className="account-signout" role="menuitem" onClick={signOut}><span>↪</span> Sign out</button></div>}</div></div>
    </aside>
    <section className="main-area"><header className="topbar"><div className="crumb">My workspace <span>/</span> {sourceName === 'No material added' ? 'Study space' : sourceName.replace(/ sample notes\\.txt$/i, '').replace(/\\.txt$/i, '')} <span>/</span> <b>{active}</b></div><div className="top-actions"><span className="saved"><i/> Saved locally</span><button className="help">?</button></div></header>
      {notice && <div className="toast">{notice}<button onClick={() => setNotice('')}>×</button></div>}
      <div className="content">
        {active === 'Materials' && <section className="card sample-inline-card"><div><span className="eyebrow">GET STARTED</span><h2>Try a sample study material</h2><p>Use these Biology notes to test topic mapping, diagnostics, and source-based answers.</p><details><summary>Preview the sample notes</summary><pre>{sampleMaterial}</pre></details></div><div className="sample-inline-actions"><button className="primary small" onClick={() => loadSampleWorkspace()}>Use sample notes <span>→</span></button><a href="/samples/biology-revision-notes.txt" download>Download .txt example</a></div></section>}
        {active === 'Student examples' && <StudentExamplesView onLoadSample={loadSampleWorkspace}/>}
        {active === 'Overview' && <><div className="welcome-row"><div><div className="eyebrow">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()} <span className="dot">·</span> YOUR STUDY DASHBOARD</div><h1>Welcome, {name.split(' ')[0]} <span className="wave">✳</span></h1><p className="subhead">Build a clearer picture of what you know and what to focus on next.</p></div><button className="primary" onClick={() => setActive(material.trim() ? 'Diagnostic' : 'Materials')}>{material.trim() ? 'Start a diagnostic' : 'Add study material'} <span>↗</span></button></div>
          <div className="stats-grid"><Stat label="OVERALL MASTERY" value={overall === null ? '—' : `${overall}%`} note={attempts.length ? `${attempts.length} attempt${attempts.length > 1 ? 's' : ''} recorded` : 'Take your first diagnostic'} icon="◉" color="mint"/><Stat label="TOPICS MAPPED" value={topics.length} note="From your study material" icon="▤" color="lavender"/><Stat label="NEEDS ATTENTION" value={weakCount || '—'} note={weakCount ? 'Weak topics to revisit' : 'Run a diagnostic to find out'} icon="⌁" color="peach"/><Stat label="STUDY STREAK" value={attempts.length ? `${Math.min(attempts.length, 7)} days` : '0 days'} note="Keep showing up" icon="✳" color="yellow"/></div>
          <div className="dashboard-grid"><section className="card mastery-card"><div className="card-head"><div><h2>Topic mastery</h2><p>Your strengths and growth areas at a glance</p></div><button className="text-link" onClick={() => setActive('Diagnosis')}>View report <span>→</span></button></div><div className="mastery-list">{scores.slice(0, 5).map((s, i) => <TopicRow key={s.topic} topic={s.topic} score={s.score} level={s.level} index={i}/>)}</div><button className="add-material" onClick={() => setActive('Materials')}><span>＋</span> Add more study material</button></section>
            <section className="card activity-card"><div className="card-head"><div><h2>Your progress</h2><p>Mastery across diagnostic attempts</p></div><span className="period">ALL TIME ⌄</span></div><div className="chart-wrap">{attempts.length ? <div className="chart"><div className="chart-y"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="chart-body"><div className="grid-lines"><i/><i/><i/><i/><i/></div><div className="bar-group">{attempts.slice(-6).map((a, i) => <div className="bar-col" key={i}><div className="bar" style={{ height: `${Math.max(4, a.score)}%` }}/><small>Try {attempts.length > 6 ? attempts.length - 6 + i + 1 : i + 1}</small></div>)}</div></div></div> : <div className="empty-chart"><div className="chart-icon">↗</div><b>Your progress will show up here</b><span>Complete a diagnostic to see how your mastery grows over time.</span><button className="mini-link" onClick={() => setActive('Diagnostic')}>Take your first diagnostic →</button></div>}</div><div className="chart-legend"><span><i/> Overall mastery</span><span>{attempts.length ? `Last attempt · ${new Date(attempts.at(-1).date).toLocaleDateString()}` : 'Your first attempt is a baseline'}</span></div></section></div>
          <div className="bottom-grid"><section className="card next-card"><div className="card-head"><div><h2>Your next best step</h2><p>A little focus goes a long way</p></div><span className="spark">✳</span></div><div className="next-body"><div className="next-icon">✦</div><div><b>{weakCount ? `Focus on ${scores.find(s => s.level === 'weak')?.topic}` : 'Take a diagnostic to find your gaps'}</b><p>{weakCount ? 'Your diagnosis will help you spend time where it matters most.' : 'We’ll ask questions from your own material, then build a focused plan.'}</p></div></div><button className="outline-btn" onClick={() => setActive(weakCount ? 'Study plan' : 'Diagnostic')}>{weakCount ? 'Open study plan' : 'Start diagnostic'} <span>→</span></button></section><section className="card source-card"><div className="card-head"><div><h2>Study material</h2><p>Sources powering your diagnosis</p></div><button className="more">···</button></div><div className="source-row"><div className="file-icon">▤</div><div className="source-meta"><b>{sourceName}</b><small>{topics.length} topics · indexed just now</small></div><span className="source-status">READY</span></div><button className="text-link" onClick={() => setActive('Materials')}>Manage material <span>→</span></button></section></div>
        </>}
        {active === 'Materials' && <><PageHeading eyebrow="YOUR KNOWLEDGE BASE" title="Study material" subtitle="Your material is the only source for generated questions and explanations."/><div className="materials-layout"><section className="card upload-card"><div className="section-title"><div className="upload-icon">↑</div><div><h2>Add study material</h2><p>Upload a text file or paste notes, syllabus, and past-paper content.</p></div></div><label className="dropzone"><input type="file" accept=".txt,.md,.csv,.pdf,text/plain,text/markdown" onChange={e => handleUpload(e.target.files?.[0])}/><span className="upload-cloud">↑</span><b>Choose a file to upload</b><small>TXT, MD, CSV or PDF · text files are indexed directly</small></label><div className="or-divider"><span>OR PASTE YOUR MATERIAL</span></div><textarea className="material-editor" value={material} onChange={e => { setMaterial(e.target.value); setTopics(buildTopicMap(e.target.value)); }} placeholder="Paste your syllabus, notes, or past paper text here…"/><div className="editor-footer"><span>{material.trim().split(/\s+/).filter(Boolean).length} words · saved in this browser</span><button className="primary small" onClick={() => { const mapped = buildTopicMap(material); setTopics(mapped); setQuiz(questionsFromMaterial(material, mapped)); setAnswers({}); setReport(null); setNotice(`Material indexed and diagnostic questions generated. ${mapped.length} topics mapped.`); setTimeout(() => setNotice(''), 3000); }}>Update topic map <span>→</span></button></div></section><section className="card topic-map-card"><div className="card-head"><div><h2>Your topic map</h2><p>{topics.length} topics found in your syllabus</p></div><span className="map-count">{topics.length}</span></div><div className="topic-map-list">{topics.map((t, i) => <div className="map-topic" key={t}><span className="topic-num">{String(i + 1).padStart(2, '0')}</span><span>{t}</span><span className="map-dot"/></div>)}</div><div className="retrieval-note"><span>✦</span><p><b>How retrieval works</b><br/>We match each question to relevant passages in your material and show the source section alongside it.</p></div></section></div></>}
        {active === 'Diagnostic' && <><PageHeading eyebrow="KNOWLEDGE CHECK" title="Diagnostic quiz" subtitle="Answer from memory. Each question is grounded in your uploaded material."/><div className="quiz-toolbar"><div className="quiz-progress"><span className="quiz-spark">✳</span><div><b>{quiz.length} questions</b><small>Across {new Set(quiz.map(q => q.topic)).size} topics · Your answers stay private</small></div></div><span className="source-pill">⌕ Material-grounded</span></div><div className="quiz-list">{quiz.map((q, i) => <div className="card question-card" key={i}><div className="question-top"><span className="question-num">QUESTION {String(i + 1).padStart(2, '0')}</span><span className="topic-pill">{q.topic}</span></div><h2>{q.prompt}</h2><div className="citation">▤ <span>From your material: <b>{q.cite}</b></span></div><textarea value={answers[i] || ''} onChange={e => setAnswers({ ...answers, [i]: e.target.value })} placeholder="Write your answer in your own words…"/><span className="answer-tip">A few clear sentences are enough.</span></div>)}</div><div className="submit-row"><span>Take your time — this is a no-pressure baseline.</span><button className="primary" onClick={submitQuiz} disabled={busy}>{busy ? 'Checking…' : 'Submit & see my diagnosis'} <span>→</span></button></div></>}
        {active === 'Diagnosis' && <><PageHeading eyebrow="YOUR STUDY DIAGNOSIS" title="Here’s what we found" subtitle="A clear picture of what’s solid and what deserves your attention."/><div className="diagnosis-summary"><div className="score-circle"><strong>{overall}%</strong><small>MASTERY</small></div><div className="diagnosis-copy"><div className="summary-label">{report ? 'DIAGNOSTIC COMPLETE' : 'READY WHEN YOU ARE'}</div><h2>{report ? (overall >= 80 ? 'A strong foundation.' : overall >= 50 ? 'You’re building momentum.' : 'Now we know where to focus.') : 'Your report starts with a diagnostic.'}</h2><p>{report ? `You answered ${report.responses.filter(x => x.correct).length} of ${report.responses.length} questions correctly. Use the topic breakdown below to guide your revision.` : 'Take a short, source-grounded quiz and we’ll identify weak, medium, and strong topics for you.'}</p>{report && <span className="report-date">Latest attempt · {new Date(report.date).toLocaleString()}</span>}</div><button className="outline-btn" onClick={() => setActive('Diagnostic')}>Retake diagnostic ↗</button></div><div className="diagnosis-columns"><section className="card report-card"><div className="card-head"><div><h2>Topic-by-topic report</h2><p>Your answers, organized into actionable signals</p></div><div className="legend"><span className="weak-dot"/> Weak <span className="medium-dot"/> Medium <span className="strong-dot"/> Strong</div></div><div className="report-topics">{scores.map(s => <div className="report-topic" key={s.topic}><div className={`status-icon ${s.level}`}>{s.level === 'weak' ? '!' : s.level === 'medium' ? '·' : s.level === 'strong' ? '✓' : '–'}</div><div className="report-topic-copy"><div className="report-topic-title"><b>{s.topic}</b><span className={`level-label ${s.level}`}>{s.level}</span></div><p>{s.reason}</p><div className="thin-progress"><span className={s.level} style={{ width: `${s.score ?? 0}%` }}/></div></div><strong className="topic-score">{s.score === null ? '—' : `${s.score}%`}</strong></div>)}</div></section><aside className="card insight-card"><div className="insight-symbol">✦</div><h2>{weakCount ? 'Your highest-impact focus' : 'Ready to find your focus?'}</h2><p>{weakCount ? 'Start with your weakest topic, then revisit it with active recall before retesting.' : 'Your first diagnostic gives us a baseline. We’ll use your answers to make this report specific to you.'}</p><button className="primary small" onClick={() => setActive(weakCount ? 'Study plan' : 'Diagnostic')}>{weakCount ? 'View my plan' : 'Take diagnostic'} <span>→</span></button></aside></div>{report && <section className="card feedback-card"><div className="card-head"><div><h2>Answer feedback</h2><p>Why each answer was marked right or wrong</p></div></div><div className="feedback-list">{report.responses.map((r, i) => <div className="feedback-row" key={i}><span className={`feedback-check ${r.correct ? 'right' : 'wrong'}`}>{r.correct ? '✓' : '×'}</span><div><b>{r.prompt}</b><p>{r.feedback} <span>· {r.cite}</span></p></div></div>)}</div></section>}</>}
        {active === 'Study plan' && <><PageHeading eyebrow="PERSONALIZED REVISION" title="Your study plan" subtitle="A practical sequence based on your gaps and the time you have available."/><section className="card time-card"><div className="time-intro"><div className="plan-icon">↗</div><div><h2>Make it fit your week</h2><p>Your plan reprioritizes automatically when your diagnosis changes.</p></div></div><div className="time-inputs"><label>I have <input type="number" min="1" max="60" value={days} onChange={e => setDays(Math.max(1, +e.target.value))}/> days</label><label><input type="number" min="0.5" step="0.5" max="16" value={hours} onChange={e => setHours(Math.max(.5, +e.target.value))}/> hours per day</label></div></section><div className="plan-header"><div><h2>Recommended sequence</h2><p>Weakest topics first, with more time for the biggest gaps.</p></div><span className="total-time">{days * hours}h total available</span></div>{planItems.length ? <div className="plan-list">{planItems.map((item, i) => <article className="card plan-item" key={item.topic}><div className="plan-order">{String(i + 1).padStart(2, '0')}</div><div className={`plan-status ${item.level}`}/><div className="plan-details"><div className="plan-title"><h3>{item.topic}</h3><span className={`level-label ${item.level}`}>{item.level}</span></div><p>{item.reason}</p><div className="plan-actions"><span>◷ {item.minutes} min · Active recall + practice</span><button className="mini-link" onClick={() => setActive('Ask your material')}>Ask about this topic →</button></div></div></article>)}</div> : <div className="card plan-empty"><div className="empty-chart"><div className="chart-icon">✳</div><b>Your plan is waiting for a diagnosis</b><span>Take a diagnostic first. We’ll prioritize topics based on your answers.</span><button className="primary small" onClick={() => setActive('Diagnostic')}>Take diagnostic →</button></div></div>}<div className="plan-footnote">✦ &nbsp;Each new diagnostic updates your topic priorities and study time.</div></>}
        {active === 'Ask your material' && <><PageHeading eyebrow="SOURCE-GROUNDED HELP" title="Ask your material" subtitle="Get explanations grounded in your own notes. If the answer isn’t there, we’ll say so."/><div className="assistant-layout"><section className="card chat-card"><div className="chat-header"><div className="assistant-avatar">✳</div><div><b>Study companion</b><small><i/> Answers only from your material</small></div><span className="source-pill">⌕ Source search</span></div><div className="chat-messages">{chat.length === 0 && <div className="chat-welcome"><div className="chat-welcome-icon">✦</div><h2>What would you like to understand?</h2><p>I’ll look through your study material and explain it in context.</p><div className="suggestions">{topics.slice(0, 3).map(topic => <button key={topic} onClick={() => setChatInput(`Explain ${topic}`)}>Explain {topic} <span>↗</span></button>)}</div>{!material.trim() && <button className="mini-link" onClick={() => setActive('Materials')}>Add study material to get started →</button>}</div>}{chat.map((m, i) => <div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role === 'user' ? initials(name) : '✳'}</div><div className="message-body"><div className="message-label">{m.role === 'user' ? name.split(' ')[0] : 'Study companion'}</div><p>{m.text}</p>{m.cite && <span className="message-cite">▤ {m.cite}</span>}</div></div>)}{busy && <div className="typing">Searching your material…</div>}</div><form className="chat-form" onSubmit={askAssistant}><input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about a topic in your material…"/><button className="send-btn" disabled={busy || !chatInput.trim()} aria-label="Send message">↑</button></form><div className="chat-privacy">Your study data stays in this browser. {process.env.NEXT_PUBLIC_GROQ_ENABLED === 'true' ? 'Questions and retrieved excerpts are sent for AI explanations.' : 'Add a Groq API key to enable AI-backed answers.'}</div></section><aside className="card chat-source"><h2>Your source</h2><p>Answers are retrieved from this material only.</p><div className="source-row"><div className="file-icon">▤</div><div className="source-meta"><b>{sourceName}</b><small>{topics.length} mapped topics</small></div></div><div className="grounding-box"><span>✦</span><p><b>How answers stay grounded</b><br/>We retrieve the closest matching passage from your material before answering. Every response points back to its section.</p></div><button className="mini-link" onClick={() => setActive('Materials')}>Manage sources →</button></aside></div></>}
      </div><footer className="footer"><span>✳ &nbsp;GapFinder AI</span><span>Study with intention. Improve with evidence.</span></footer></section>
  </main>;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const isAdmin = mode === 'admin';
      const response = await fetch(isAdmin ? '/api/admin/login' : `/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isAdmin ? { username: email, password } : { name, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not complete sign-in.');
      onAuth(isAdmin ? { id: 'sample-admin', name: 'Administrator', email: '', role: 'admin' } : data.user, isAdmin ? 'Student examples' : 'Overview');
    } catch (requestError) { setError(requestError.message || 'Could not connect to the account service.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell"><div className="auth-brand"><div className="brand-mark">g.</div><div><b>gapfinder</b><small>STUDY INTELLIGENCE</small></div></div><section className="auth-card"><div className="auth-art"><span>✳</span><i>▤</i><b>✦</b></div><div className="eyebrow">YOUR PERSONAL STUDY SPACE</div><h1>{mode === 'register' ? 'Create your account.' : mode === 'admin' ? 'Administrator sign in.' : 'Welcome back.'}</h1><p className="auth-intro">{mode === 'register' ? 'Start finding what you know — and what to focus on next.' : mode === 'admin' ? 'Sign in to view the fictional sample student roster.' : 'Sign in to continue your learning diagnosis.'}</p><form className="auth-form" onSubmit={submit}>{mode === 'register' && <label>Full name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={80} required/></label>}<label>{mode === 'admin' ? 'Admin username' : 'Email address'}<input type={mode === 'admin' ? 'text' : 'email'} autoComplete={mode === 'admin' ? 'username' : 'email'} value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required/></label><label>Password<input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={mode === 'register' ? 12 : undefined} maxLength={256} required/>{mode === 'register' && <small>Use at least 12 characters.</small>}</label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create student account' : mode === 'admin' ? 'Open sample roster' : 'Sign in'}<span>→</span></button></form><div className="auth-switch">{mode === 'register' ? 'Already have an account?' : mode === 'admin' ? 'Student account?' : 'New to GapFinder?'} <button onClick={() => { setMode(mode === 'register' || mode === 'admin' ? 'login' : 'register'); setError(''); }} type="button">{mode === 'register' || mode === 'admin' ? 'Sign in' : 'Create an account'}</button></div><button className="auth-admin-link" type="button" onClick={() => { setMode(mode === 'admin' ? 'login' : 'admin'); setError(''); }}> {mode === 'admin' ? 'Back to student sign in' : 'Administrator sample roster sign in'}</button>{mode !== 'admin' && <p className="auth-note">Your password is hashed on the server. Study materials and progress are saved in this browser for this account.</p>}</section><footer className="auth-footer"><span>✳ &nbsp;GapFinder AI</span><span>Find what you don’t know. Fix what matters.</span></footer></main>;
}

function StudentExamplesView({ onLoadSample }) {
  return <><PageHeading eyebrow="FICTIONAL DEMO DATA" title="Student examples" subtitle="Explore sample learner profiles and load subject notes into your workspace to try the study tools."/><div className="sample-banner"><b>Example profiles</b><span>These students and performance figures are fictional. No administrator sign-in is needed to view this sample roster.</span></div><div className="student-cards">{sampleStudents.map(student => <article className="card student-card" key={student.email}><div className="student-card-head"><div className="avatar">{initials(student.name)}</div><div><b>{student.name}</b><small>{student.grade} · {student.subject}</small></div><span className={`level-label ${student.mastery >= 75 ? 'strong' : student.mastery >= 50 ? 'medium' : 'weak'}`}>{student.lastActive}</span></div><div className="student-facts"><span>{student.diagnostics} diagnostics</span><span>Sample profile</span></div><div className="student-mastery"><span>Overall mastery</span><b>{student.mastery}%</b></div><div className="thin-progress"><span style={{ width: `${student.mastery}%` }}/></div><p><b>Strengths:</b> {student.strengths}</p><p><b>Focus next:</b> {student.focus}</p><button className="outline-btn sample-student-action" onClick={() => onLoadSample(student)}>Load {student.subject} notes <span>→</span></button></article>)}</div><section className="card sample-material-card"><div><h2>Sample study material</h2><p>Start with structured Biology revision notes, then update the topic map and take a diagnostic.</p></div><div className="sample-inline-actions"><button className="primary small" onClick={() => onLoadSample()}>Load Biology notes <span>→</span></button><a href="/samples/biology-revision-notes.txt" download>Download .txt example</a></div></section></>;
}

function Stat({ label, value, note, icon, color }) { return <div className="card stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function TopicRow({ topic, score, level, index }) { const color = ['#75b99f','#9c89cf','#7f9ac6','#d9a26f','#91aa78'][index % 5]; return <div className="topic-row"><span className="topic-marker" style={{ background: color }}/><span className="topic-name">{topic}</span><div className="topic-track"><span style={{ width: `${score ?? 0}%`, background: color }}/></div><span className="topic-percent">{score === null ? '—' : `${score}%`}</span><span className={`topic-state ${level}`}>{level}</span></div>; }
function PageHeading({ eyebrow, title, subtitle }) { return <div className="page-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>; }
