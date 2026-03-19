import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const VOICES = [
  { id: 'en-US-natalie', name: 'Natalie', lang: 'EN · US', gender: '♀', tone: 'Warm' },
  { id: 'en-US-marcus',  name: 'Marcus',  lang: 'EN · US', gender: '♂', tone: 'Deep' },
  { id: 'en-UK-hazel',   name: 'Hazel',   lang: 'EN · UK', gender: '♀', tone: 'Crisp' },
  { id: 'en-UK-oliver',  name: 'Oliver',  lang: 'EN · UK', gender: '♂', tone: 'Clear' },
  { id: 'en-IN-aarav',   name: 'Aarav',   lang: 'EN · IN', gender: '♂', tone: 'Rich' },
  { id: 'en-IN-priya',   name: 'Priya',   lang: 'EN · IN', gender: '♀', tone: 'Soft' },
];

const LOADING_STEPS = [
  'Initializing neural engine...',
  'Parsing content structure...',
  'Synthesizing narration...',
  'Encoding audio waveform...',
  'Finalizing output...',
];

const PREGENERATED = [
  { id: 1, title: 'The Quantum Internet', category: 'Science & Technology', duration: '4:32', icon: '⚛', color: '#00f5c8' },
  { id: 2, title: 'AI & The Future of Work', category: 'Science & Technology', duration: '5:10', icon: '🤖', color: '#00f5c8' },
  { id: 3, title: 'The Rise of Rome', category: 'History & Culture', duration: '6:45', icon: '🏛', color: '#f5a623' },
  { id: 4, title: 'Silk Road Chronicles', category: 'History & Culture', duration: '5:20', icon: '🗺', color: '#f5a623' },
  { id: 5, title: 'The Art of Stoicism', category: 'Philosophy & Life', duration: '4:55', icon: '🧠', color: '#b96cf6' },
  { id: 6, title: 'Finding Purpose', category: 'Philosophy & Life', duration: '3:48', icon: '✦', color: '#b96cf6' },
  { id: 7, title: 'Black Holes Explained', category: 'Nature & Space', duration: '5:30', icon: '🌌', color: '#4fc3f7' },
  { id: 8, title: 'Oceans of the Deep', category: 'Nature & Space', duration: '4:15', icon: '🌊', color: '#4fc3f7' },
  { id: 9, title: 'Surviving Finals Week', category: 'College Life', duration: '3:22', icon: '📚', color: '#ff6b6b' },
  { id: 10, title: 'Dorm Room Cooking', category: 'College Life', duration: '2:58', icon: '🍜', color: '#ff6b6b' },
];

export default function App() {
  const [page, setPage] = useState('landing');
  const [theme, setTheme] = useState('dark');
  const [mode, setMode] = useState('pdf');
  const [pdfFile, setPdfFile] = useState(null);
  const [topic, setTopic] = useState('');
  const [voice, setVoice] = useState(VOICES[0]);
  const [status, setStatus] = useState('idle');
  const [audioUrl, setAudioUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [recentBooks, setRecentBooks] = useState([]);
  const [activePreview, setActivePreview] = useState(null); // which pre-gen is "playing"
  const [filterCat, setFilterCat] = useState('All');
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const loadingInterval = useRef(null);
  const progressInterval = useRef(null);

  const CATEGORIES = ['All', 'Science & Technology', 'History & Culture', 'Philosophy & Life', 'Nature & Space', 'College Life'];

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  useEffect(() => {
    if (status === 'loading') {
      let step = 0; let progress = 0;
      loadingInterval.current = setInterval(() => { step = (step + 1) % LOADING_STEPS.length; setLoadingStep(step); }, 2200);
      progressInterval.current = setInterval(() => { progress = Math.min(progress + Math.random() * 3, 92); setLoadingProgress(progress); }, 200);
    } else {
      clearInterval(loadingInterval.current); clearInterval(progressInterval.current);
      if (status === 'done') setLoadingProgress(100);
    }
    return () => { clearInterval(loadingInterval.current); clearInterval(progressInterval.current); };
  }, [status]);

  const handleFileChange = (e) => { const f = e.target.files[0]; if (f && f.type === 'application/pdf') setPdfFile(f); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && f.type === 'application/pdf') setPdfFile(f); };

  const handleSubmit = async () => {
    setStatus('loading'); setLoadingStep(0); setLoadingProgress(0); setAudioUrl(null); setErrorMsg(''); setPlaying(false);
    try {
      let response;
      if (mode === 'pdf') {
        if (!pdfFile) { setErrorMsg('Please select a PDF.'); setStatus('error'); return; }
        const formData = new FormData();
        formData.append('file', pdfFile); formData.append('voice_id', voice.id);
        response = await axios.post('/api/pdf-to-audio', formData, { responseType: 'blob', headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (!topic.trim()) { setErrorMsg('Please enter a topic.'); setStatus('error'); return; }
        response = await axios.post('/api/topic-to-audio', { topic, voice_id: voice.id }, { responseType: 'blob' });
      }
      const url = URL.createObjectURL(new Blob([response.data], { type: 'audio/mpeg' }));
      setAudioUrl(url);
      setStatus('done');
      // Add to recent
      const newBook = {
        id: Date.now(),
        title: mode === 'pdf' ? pdfFile?.name?.replace('.pdf', '') : topic.slice(0, 40),
        voice: voice.name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        url,
        mode,
      };
      setRecentBooks(prev => [newBook, ...prev].slice(0, 5));
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Connection failed. Is the backend running?');
      setStatus('error');
    }
  };

  const playRecent = (book) => {
    setAudioUrl(book.url); setStatus('done'); setPlaying(false);
    setActivePreview(null);
    setTimeout(() => { if (audioRef.current) { audioRef.current.load(); audioRef.current.play(); setPlaying(true); } }, 100);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause(); else audioRef.current.play();
    setPlaying(!playing);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) audioRef.current.currentTime = pct * duration;
  };

  const formatTime = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}`; };
  const handleDownload = () => { const a = document.createElement('a'); a.href = audioUrl; a.download = 'audiobook.mp3'; a.click(); };

  const filtered = filterCat === 'All' ? PREGENERATED : PREGENERATED.filter(b => b.category === filterCat);

  // ── LANDING ──────────────────────────────────────────
  if (page === 'landing') {
    return (
      <div className="landing">
        <div className="grid-bg" /><div className="scan-line" />
        <nav className="nav">
          <div className="nav-logo"><span className="nav-dot" />AUDIOSCRIBE</div>
          <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀' : '◑'}</button>
        </nav>
        <div className="hero">
          <div className="hero-badge">[ AI-POWERED NARRATION SYSTEM v2.0 ]</div>
          <h1 className="hero-title">
            <span className="hero-line">TRANSFORM</span>
            <span className="hero-line">ANY TEXT INTO</span>
            <span className="hero-line">AUDIO<span className="accent-text">BOOKS</span></span>
          </h1>
          <p className="hero-sub">Upload PDFs or enter any topic — our neural engine converts it into a fully narrated audiobook in seconds.</p>
          <div className="hero-stats">
            <div className="stat"><span className="stat-val">6</span><span className="stat-label">AI Voices</span></div>
            <div className="stat-div" />
            <div className="stat"><span className="stat-val">∞</span><span className="stat-label">Topics</span></div>
            <div className="stat-div" />
            <div className="stat"><span className="stat-val">MP3</span><span className="stat-label">Output</span></div>
          </div>
          <button className="cta-btn" onClick={() => setPage('app')}>
            <span className="cta-inner">GENERATE AUDIOBOOK <span className="cta-arrow">→</span></span>
            <span className="cta-glow" />
          </button>
          <div className="hero-features">
            {['PDF Upload', 'Topic Generation', 'Murf AI TTS', 'Instant Download'].map(f => (
              <div key={f} className="feature-tag"><span className="feature-dot">◆</span> {f}</div>
            ))}
          </div>
        </div>
        <div className="landing-footer"><span>POWERED BY</span><span className="footer-brand">MURF AI</span><span className="footer-sep">×</span><span className="footer-brand">GEMINI</span></div>
      </div>
    );
  }

  // ── APP PAGE ──────────────────────────────────────────
  return (
    <div className="app-page">
      <div className="grid-bg" />
      <header className="topbar">
        <button className="back-btn" onClick={() => setPage('landing')}>← BACK</button>
        <div className="topbar-logo"><span className="nav-dot" />AUDIOSCRIBE</div>
        <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀' : '◑'}</button>
      </header>

      <div className="three-col">

        {/* ── LEFT SIDEBAR: Recent ── */}
        <aside className="sidebar sidebar-left">
          <div className="sidebar-header">
            <span className="sidebar-dot" />
            <span className="sidebar-title">RECENT</span>
            <span className="sidebar-count">{recentBooks.length}</span>
          </div>

          {recentBooks.length === 0 ? (
            <div className="sidebar-empty">
              <div className="empty-icon">◎</div>
              <p>No audiobooks yet.</p>
              <p>Generate one to see it here.</p>
            </div>
          ) : (
            <div className="sidebar-list">
              {recentBooks.map((book, i) => (
                <div key={book.id} className="recent-item" onClick={() => playRecent(book)} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="recent-icon">{book.mode === 'pdf' ? '▣' : '✦'}</div>
                  <div className="recent-info">
                    <p className="recent-title">{book.title}</p>
                    <p className="recent-meta">{book.voice} · {book.time}</p>
                  </div>
                  <button className="recent-play">▶</button>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── CENTER: Main App ── */}
        <main className="app-main">
          <div className="mode-bar">
            <button className={`mode-tab ${mode === 'pdf' ? 'active' : ''}`} onClick={() => setMode('pdf')}><span>▣</span> PDF UPLOAD</button>
            <button className={`mode-tab ${mode === 'topic' ? 'active' : ''}`} onClick={() => setMode('topic')}><span>✦</span> TOPIC MODE</button>
          </div>

          <div className="glass-card">
            <div className="card-corner tl" /><div className="card-corner tr" />
            <div className="card-corner bl" /><div className="card-corner br" />

            {mode === 'pdf' ? (
              <div className={`dropzone ${dragOver ? 'drag-over' : ''} ${pdfFile ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                <div className="drop-icon">{pdfFile ? '▣' : '⊕'}</div>
                {pdfFile ? <><p className="drop-filename">{pdfFile.name}</p><p className="drop-hint">Click to change</p></>
                  : <><p className="drop-label">DROP PDF HERE</p><p className="drop-hint">or click to browse · PDF only</p></>}
                <div className="drop-scanner" />
              </div>
            ) : (
              <div className="topic-wrap">
                <label className="field-label">// ENTER TOPIC</label>
                <textarea className="topic-input" placeholder="e.g. The history of ancient Rome, Quantum computing basics..." value={topic} onChange={(e) => setTopic(e.target.value)} rows={4} />
                <div className="topic-meta"><span className="topic-cursor">▌</span><span className="char-count">{topic.length} chars</span></div>
              </div>
            )}

            <div className="voice-section">
              <label className="field-label">// SELECT NARRATOR</label>
              <div className="voice-grid">
                {VOICES.map((v) => (
                  <button key={v.id} className={`voice-chip ${voice.id === v.id ? 'selected' : ''}`} onClick={() => setVoice(v)}>
                    <span className="v-gender">{v.gender}</span>
                    <span className="v-name">{v.name}</span>
                    <span className="v-lang">{v.lang}</span>
                    <span className="v-tone">{v.tone}</span>
                    {voice.id === v.id && <span className="v-active-dot" />}
                  </button>
                ))}
              </div>
            </div>

            <button className={`gen-btn ${status === 'loading' ? 'generating' : ''}`} onClick={handleSubmit} disabled={status === 'loading'}>
              {status === 'loading' ? <span>PROCESSING...</span> : <span>▶ GENERATE AUDIOBOOK</span>}
              <span className="gen-shine" />
            </button>

            {status === 'error' && <div className="error-box">⚠ {errorMsg}</div>}
          </div>

          {/* Loading Panel */}
          {status === 'loading' && (
            <div className="loading-card">
              <div className="card-corner tl" /><div className="card-corner tr" />
              <div className="card-corner bl" /><div className="card-corner br" />
              <div className="loading-header">
                <div className="loading-orb">
                  <div className="orb-ring r1" /><div className="orb-ring r2" /><div className="orb-ring r3" />
                  <div className="orb-core" />
                </div>
                <div className="loading-info">
                  <p className="loading-step">{LOADING_STEPS[loadingStep]}</p>
                  <p className="loading-pct">{Math.round(loadingProgress)}%</p>
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${loadingProgress}%` }}><div className="progress-glow" /></div>
              </div>
              <div className="loading-bars">
                {[...Array(24)].map((_, i) => <div key={i} className="l-bar" style={{ animationDelay: `${i * 0.06}s` }} />)}
              </div>
            </div>
          )}

          {/* Audio Player */}
          {status === 'done' && audioUrl && (
            <div className="player-card">
              <div className="card-corner tl" /><div className="card-corner tr" />
              <div className="card-corner bl" /><div className="card-corner br" />
              <audio ref={audioRef} src={audioUrl}
                onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} />
              <div className="player-top">
                <div>
                  <p className="player-label">// NOW PLAYING</p>
                  <p className="player-title">{mode === 'pdf' ? pdfFile?.name?.replace('.pdf', '') : topic.slice(0, 40)}</p>
                  <p className="player-voice">Narrated by {voice.name} · {voice.lang}</p>
                </div>
                <div className={`player-waveform ${playing ? 'active' : ''}`}>
                  {[...Array(20)].map((_, i) => <span key={i} className="pw-bar" style={{ animationDelay: `${i * 0.07}s` }} />)}
                </div>
              </div>
              <div className="seek-wrap" onClick={handleSeek}>
                <div className="seek-track">
                  <div className="seek-fill" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}>
                    <div className="seek-head" />
                  </div>
                </div>
              </div>
              <div className="seek-times"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
              <div className="player-controls">
                <div className="volume-wrap">
                  <span className="vol-icon">◁)</span>
                  <input type="range" min="0" max="1" step="0.01" value={volume} className="vol-slider"
                    onChange={(e) => { setVolume(e.target.value); if (audioRef.current) audioRef.current.volume = e.target.value; }} />
                </div>
                <button className="play-btn" onClick={togglePlay}>
                  <span className="play-icon">{playing ? '⏸' : '▶'}</span>
                  <div className="play-ring" />
                </button>
                <button className="dl-btn" onClick={handleDownload}>↓ MP3</button>
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR: Pre-generated ── */}
        <aside className="sidebar sidebar-right">
          <div className="sidebar-header">
            <span className="sidebar-dot sidebar-dot-purple" />
            <span className="sidebar-title">LIBRARY</span>
          </div>

          {/* Category Filter */}
          <div className="cat-filters">
            {CATEGORIES.map(c => (
              <button key={c} className={`cat-btn ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>
                {c === 'All' ? 'ALL' : c.split(' ')[0].toUpperCase()}
              </button>
            ))}
          </div>

          <div className="sidebar-list">
            {filtered.map((book, i) => (
              <div key={book.id} className={`pregen-item ${activePreview === book.id ? 'active-pregen' : ''}`}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => setActivePreview(activePreview === book.id ? null : book.id)}>
                <div className="pregen-icon" style={{ color: book.color, textShadow: `0 0 10px ${book.color}` }}>{book.icon}</div>
                <div className="pregen-info">
                  <p className="pregen-title">{book.title}</p>
                  <p className="pregen-cat" style={{ color: book.color }}>{book.category}</p>
                </div>
                <div className="pregen-right">
                  <span className="pregen-dur">{book.duration}</span>
                  <span className="pregen-play">{activePreview === book.id ? '⏸' : '▶'}</span>
                </div>
                {activePreview === book.id && (
                  <div className="pregen-preview">
                    <div className="preview-bars">
                      {[...Array(12)].map((_, j) => <span key={j} className="pb" style={{ animationDelay: `${j * 0.08}s`, background: book.color }} />)}
                    </div>
                    <span className="preview-note">Demo preview — generate your own above!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
}
