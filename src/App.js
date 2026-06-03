import { useState, useEffect, useCallback } from 'react'
import {
  supabase,
  getInbox, addInboxItem, deleteInboxItem,
  getProjects, addProject, updateProject, deleteProject,
  getSomeday, addSomedayItem, deleteSomedayItem,
} from './supabase'

const TABS = ['Inbox', 'Projects', 'Someday', 'Review']
const STATUS_OPTIONS = ['🟢 Active', '⏳ Waiting', '💤 Someday', '✅ Done']
const AREA_OPTIONS = ['Work', 'Life', 'Health', 'Finance', 'Other']

const REVIEW_CHECKS = [
  'Clear inbox to zero',
  'Every active project has a current next action',
  'Someday list reviewed — anything to activate?',
  'Waiting items chased up',
  '3 priorities identified for the week ahead',
]

const DEFAULT_PROJECTS = [
  { name: 'Job Search', outcome: 'Signed offer at a company I\'m excited about', next_action: 'Research open roles at Wolt and Deliveroo', status: '🟢 Active', area: 'Work' },
  { name: 'Calibre Consulting', outcome: 'Two active paying clients by Q3', next_action: 'Follow up with current clients on next deliverable', status: '🟢 Active', area: 'Work' },
  { name: 'NYC Marathon', outcome: 'Cross the finish line & hit $4k fundraising', next_action: 'Plan next fundraising event', status: '🟢 Active', area: 'Health' },
  { name: 'Life / Admin', outcome: 'Stay on top of recurring life admin', next_action: 'Review and clear outstanding admin tasks', status: '🟢 Active', area: 'Life' },
]

// ── Styles ──────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0a;
    --surface: #141414;
    --surface2: #1c1c1c;
    --border: #252525;
    --border2: #2e2e2e;
    --text: #e4ddd3;
    --text2: #7a7267;
    --text3: #3e3a36;
    --gold: #c9b97b;
    --gold-dim: #c9b97b22;
    --green: #7ac87a;
    --green-dim: #7ac87a18;
    --red: #c87a7a;
    --radius: 8px;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-mono: 'DM Mono', 'Courier New', monospace;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  input, select, textarea, button { font-family: var(--font-mono); }

  .app { display: flex; flex-direction: column; min-height: 100vh; max-width: 720px; margin: 0 auto; }

  /* Header */
  .header {
    padding: 32px 28px 0;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0;
    background: var(--bg);
    z-index: 10;
  }
  .header-top { display: flex; align-items: baseline; gap: 10px; margin-bottom: 2px; }
  .header-eyebrow { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text3); }
  .header-title { font-family: var(--font-display); font-size: 24px; font-weight: 400; color: var(--text); letter-spacing: -0.01em; }
  .tabs { display: flex; margin-top: 22px; }
  .tab {
    background: none; border: none; cursor: pointer;
    padding: 10px 20px 10px; font-size: 12px; letter-spacing: 0.06em;
    color: var(--text3); border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s; position: relative;
  }
  .tab.active { color: var(--text); border-bottom-color: var(--gold); }
  .tab:hover:not(.active) { color: var(--text2); }
  .tab-badge {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--gold); color: var(--bg);
    border-radius: 10px; font-size: 9px; font-weight: 500;
    padding: 1px 5px; margin-left: 6px; vertical-align: middle;
  }

  /* Content */
  .content { flex: 1; padding: 28px; }
  .section-hint { font-size: 12px; color: var(--text2); margin-bottom: 22px; line-height: 1.6; }

  /* Capture bar */
  .capture-form { display: flex; gap: 8px; margin-bottom: 28px; }
  .capture-input {
    flex: 1; background: var(--surface); border: 1px solid var(--border2);
    border-radius: var(--radius); padding: 12px 14px; color: var(--text);
    font-size: 13px; outline: none; transition: border-color 0.15s;
  }
  .capture-input:focus { border-color: var(--gold); }
  .capture-input::placeholder { color: var(--text3); }
  .btn-gold {
    background: var(--gold); color: var(--bg); border: none;
    border-radius: var(--radius); padding: 0 20px; font-size: 12px;
    cursor: pointer; font-weight: 500; letter-spacing: 0.04em;
    transition: opacity 0.15s; white-space: nowrap;
  }
  .btn-gold:hover { opacity: 0.88; }
  .btn-gold:disabled { opacity: 0.4; cursor: default; }

  /* Cards */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px 18px; margin-bottom: 10px;
    transition: border-color 0.15s;
  }
  .card:hover { border-color: var(--border2); }
  .card-row { display: flex; align-items: center; gap: 10px; }
  .card-text { flex: 1; font-size: 14px; line-height: 1.5; }
  .card-meta { font-size: 11px; color: var(--text2); margin-top: 4px; letter-spacing: 0.04em; }

  /* Buttons */
  .btn { background: var(--surface2); border: 1px solid var(--border2); border-radius: 5px; padding: 6px 12px; font-size: 11px; cursor: pointer; color: var(--text2); transition: color 0.1s, border-color 0.1s; white-space: nowrap; letter-spacing: 0.03em; }
  .btn:hover { color: var(--text); border-color: var(--text3); }
  .btn-danger { color: var(--red); border-color: var(--red-dim, #c87a7a22); }
  .btn-danger:hover { background: #2a1a1a; }
  .btn-accent { color: var(--gold); border-color: var(--gold-dim); }
  .btn-accent:hover { background: var(--gold-dim); }
  .btn-success { color: var(--green); border-color: var(--green-dim); }

  /* Process panel */
  .process-panel { padding-top: 12px; }
  .process-label { font-size: 10px; color: var(--gold); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px; }
  .process-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .form-select, .form-input {
    background: var(--surface2); border: 1px solid var(--border2);
    border-radius: 6px; padding: 9px 11px; color: var(--text);
    font-size: 12px; outline: none; width: 100%; margin-bottom: 8px;
    transition: border-color 0.15s;
  }
  .form-select:focus, .form-input:focus { border-color: var(--gold); }
  .form-select { cursor: pointer; }
  .form-row { display: flex; gap: 8px; }
  .form-row .form-select { margin-bottom: 0; }

  /* Project cards */
  .project-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; margin-bottom: 12px; }
  .project-name { font-family: var(--font-display); font-size: 17px; font-weight: 400; letter-spacing: -0.01em; }
  .project-tag { font-size: 10px; background: var(--surface2); border: 1px solid var(--border2); color: var(--text2); border-radius: 3px; padding: 2px 7px; letter-spacing: 0.08em; }
  .project-outcome { font-size: 12px; color: var(--text2); margin: 8px 0 14px; line-height: 1.6; }
  .next-action-label { font-size: 10px; color: var(--gold); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px; }
  .next-action-text { font-size: 13px; color: var(--text); line-height: 1.5; }
  .next-action-empty { font-size: 13px; color: var(--text3); font-style: italic; }
  .project-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
  .project-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* Filter tabs */
  .filter-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .filter-tabs { display: flex; gap: 6px; }
  .filter-tab { background: none; border: 1px solid var(--border); border-radius: 4px; padding: 5px 13px; font-size: 11px; cursor: pointer; color: var(--text3); transition: all 0.15s; letter-spacing: 0.04em; }
  .filter-tab.active { background: var(--surface2); border-color: var(--border2); color: var(--text); }

  /* New project form */
  .new-project-form { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--radius); padding: 18px; margin-bottom: 20px; }
  .form-section-label { font-size: 10px; color: var(--gold); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 14px; }

  /* Review */
  .review-check {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; margin-bottom: 8px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); cursor: pointer;
    transition: border-color 0.15s;
  }
  .review-check:hover { border-color: var(--border2); }
  .review-check.done { border-color: var(--green-dim); }
  .check-circle {
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid var(--border2); display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--green); transition: all 0.15s;
  }
  .check-circle.done { border-color: var(--green); background: var(--green-dim); }
  .check-text { font-size: 13px; transition: color 0.15s; }
  .check-text.done { color: var(--text3); text-decoration: line-through; }
  .review-complete { text-align: center; padding: 20px 0; color: var(--green); font-size: 13px; letter-spacing: 0.06em; }

  /* Snapshot */
  .snapshot-label { font-size: 10px; color: var(--text3); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 14px; }
  .snapshot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .snapshot-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 12px; text-align: center; }
  .snapshot-num { font-family: var(--font-display); font-size: 26px; font-weight: 400; }
  .snapshot-num.warn { color: var(--gold); }
  .snapshot-sub { font-size: 10px; color: var(--text2); margin-top: 3px; letter-spacing: 0.04em; }

  /* Empty state */
  .empty { text-align: center; padding: 48px 0; color: var(--text3); }
  .empty-icon { font-size: 28px; margin-bottom: 8px; }
  .empty-text { font-size: 12px; letter-spacing: 0.06em; }

  /* Divider */
  .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

  /* Loading */
  .loading { text-align: center; padding: 60px 0; color: var(--text3); font-size: 12px; letter-spacing: 0.1em; }

  /* Error */
  .error-banner { background: #2a1a1a; border: 1px solid #c87a7a44; border-radius: var(--radius); padding: 14px 16px; margin-bottom: 20px; font-size: 12px; color: var(--red); line-height: 1.6; }
`

// ── Sub-components ───────────────────────────────────────────────────────────

function InboxTab({ inbox, onAdd, onDelete, onMoveToSomeday, onProcessToProject, projects }) {
  const [text, setText] = useState('')
  const [processingId, setProcessingId] = useState(null)
  const [processAction, setProcessAction] = useState('')
  const [processProject, setProcessProject] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!text.trim() || loading) return
    setLoading(true)
    await onAdd(text.trim())
    setText('')
    setLoading(false)
  }

  async function handleDelete(id) {
    await onDelete(id)
    if (processingId === id) setProcessingId(null)
  }

  async function handleMoveToSomeday(item) {
    await onMoveToSomeday(item)
    setProcessingId(null)
  }

  async function handleProcessToProject(item) {
    if (!processProject) return
    await onProcessToProject(item, parseInt(processProject), processAction)
    setProcessingId(null)
    setProcessAction('')
    setProcessProject('')
  }

  const activeProjects = projects.filter(p => p.status === '🟢 Active')

  return (
    <div>
      <p className="section-hint">Dump everything here. No sorting, no thinking. Process later.</p>
      <form className="capture-form" onSubmit={handleAdd}>
        <input
          className="capture-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What's on your mind?"
          autoFocus
        />
        <button className="btn-gold" type="submit" disabled={loading || !text.trim()}>
          Capture
        </button>
      </form>

      {inbox.length === 0 && (
        <div className="empty">
          <div className="empty-icon">◎</div>
          <div className="empty-text">Inbox zero. Nice.</div>
        </div>
      )}

      {inbox.map(item => (
        <div className="card" key={item.id}>
          {processingId === item.id ? (
            <div className="process-panel">
              <div style={{ fontSize: 13, marginBottom: 14, color: 'var(--text)' }}>"{item.text}"</div>
              <div className="process-label">What is this?</div>
              <div className="process-actions">
                <button className="btn btn-accent" onClick={() => handleMoveToSomeday(item)}>→ Someday</button>
                <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>✕ Delete</button>
              </div>
              <div className="process-label" style={{ marginTop: 4 }}>Add as next action to project</div>
              <select className="form-select" value={processProject} onChange={e => setProcessProject(e.target.value)}>
                <option value="">Select project...</option>
                {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input
                className="form-input"
                value={processAction}
                onChange={e => setProcessAction(e.target.value)}
                placeholder="Next action (or leave blank to use text as-is)"
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  className="btn btn-gold" style={{ background: 'var(--gold)', color: 'var(--bg)', border: 'none', opacity: processProject ? 1 : 0.4 }}
                  onClick={() => handleProcessToProject(item)}
                  disabled={!processProject}
                >Add to Project</button>
                <button className="btn" onClick={() => setProcessingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="card-row">
              <span className="card-text">{item.text}</span>
              <button className="btn btn-accent" onClick={() => setProcessingId(item.id)}>Process</button>
              <button className="btn" onClick={() => handleDelete(item.id)}>✕</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ProjectsTab({ projects, onAdd, onUpdate, onDelete }) {
  const [filter, setFilter] = useState('🟢 Active')
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newProj, setNewProj] = useState({ name: '', outcome: '', next_action: '', area: 'Work', status: '🟢 Active' })
  const [loading, setLoading] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!newProj.name.trim() || loading) return
    setLoading(true)
    await onAdd(newProj)
    setNewProj({ name: '', outcome: '', next_action: '', area: 'Work', status: '🟢 Active' })
    setShowNew(false)
    setLoading(false)
  }

  const filtered = projects.filter(p => p.status === filter)

  return (
    <div>
      <div className="filter-row">
        <div className="filter-tabs">
          {['🟢 Active', '⏳ Waiting', '✅ Done'].map(s => (
            <button key={s} className={`filter-tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
        <button className="btn-gold" style={{ padding: '7px 14px', fontSize: 11 }} onClick={() => setShowNew(true)}>
          + New
        </button>
      </div>

      {showNew && (
        <form className="new-project-form" onSubmit={handleAdd}>
          <div className="form-section-label">New Project</div>
          <input className="form-input" placeholder="Project name" value={newProj.name} onChange={e => setNewProj(p => ({ ...p, name: e.target.value }))} />
          <input className="form-input" placeholder="Desired outcome — what does done look like?" value={newProj.outcome} onChange={e => setNewProj(p => ({ ...p, outcome: e.target.value }))} />
          <input className="form-input" placeholder="First next action" value={newProj.next_action} onChange={e => setNewProj(p => ({ ...p, next_action: e.target.value }))} />
          <div className="form-row" style={{ marginBottom: 12 }}>
            <select className="form-select" value={newProj.area} onChange={e => setNewProj(p => ({ ...p, area: e.target.value }))}>
              {AREA_OPTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
            <select className="form-select" value={newProj.status} onChange={e => setNewProj(p => ({ ...p, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-gold" type="submit" disabled={loading}>Add Project</button>
            <button className="btn" type="button" onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </form>
      )}

      {filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon">◇</div>
          <div className="empty-text">No {filter.toLowerCase()} projects.</div>
        </div>
      )}

      {filtered.map(project => (
        <div className="project-card" key={project.id}>
          <div className="project-header">
            <div>
              <div className="project-name-row">
                <span className="project-name">{project.name}</span>
                <span className="project-tag">{project.area}</span>
              </div>
              {project.outcome && <p className="project-outcome">{project.outcome}</p>}
            </div>
            {editingId !== project.id && (
              <button className="btn" onClick={() => setEditingId(project.id)}>Edit</button>
            )}
          </div>

          {editingId === project.id ? (
            <div>
              <div className="next-action-label">Next Action</div>
              <input className="form-input" value={project.next_action || ''} onChange={e => onUpdate(project.id, { next_action: e.target.value })} autoFocus />
              <div className="next-action-label">Outcome</div>
              <input className="form-input" value={project.outcome || ''} onChange={e => onUpdate(project.id, { outcome: e.target.value })} />
              <div className="form-row" style={{ marginBottom: 12 }}>
                <select className="form-select" value={project.status} onChange={e => onUpdate(project.id, { status: e.target.value })}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="form-select" value={project.area} onChange={e => onUpdate(project.id, { area: e.target.value })}>
                  {AREA_OPTIONS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-gold" onClick={() => setEditingId(null)}>Done</button>
                <button className="btn btn-danger" onClick={() => { onDelete(project.id); setEditingId(null) }}>Delete</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="next-action-label">Next Action</div>
              {project.next_action
                ? <div className="next-action-text">{project.next_action}</div>
                : <div className="next-action-empty">No next action set — add one</div>
              }
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SomedayTab({ someday, onActivate, onDelete }) {
  return (
    <div>
      <p className="section-hint">Things you might want to do — but not now. Review every Sunday.</p>
      {someday.length === 0 && (
        <div className="empty">
          <div className="empty-icon">◇</div>
          <div className="empty-text">Nothing here yet. Process inbox items to Someday.</div>
        </div>
      )}
      {someday.map(item => (
        <div className="card" key={item.id}>
          <div className="card-row">
            <span className="card-text">{item.text}</span>
            <button className="btn btn-accent" onClick={() => onActivate(item)}>Activate →</button>
            <button className="btn" onClick={() => onDelete(item.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReviewTab({ inbox, projects, someday }) {
  const [done, setDone] = useState({})
  const allDone = Object.values(done).filter(Boolean).length === REVIEW_CHECKS.length

  const noNextAction = projects.filter(p => p.status === '🟢 Active' && !p.next_action).length

  return (
    <div>
      <p className="section-hint">Every Sunday. 20 minutes. Non-negotiable.</p>

      {REVIEW_CHECKS.map((check, i) => (
        <div
          key={i}
          className={`review-check${done[i] ? ' done' : ''}`}
          onClick={() => setDone(d => ({ ...d, [i]: !d[i] }))}
        >
          <div className={`check-circle${done[i] ? ' done' : ''}`}>{done[i] ? '✓' : ''}</div>
          <span className={`check-text${done[i] ? ' done' : ''}`}>{check}</span>
        </div>
      ))}

      {allDone && (
        <div className="review-complete">✓ Review complete. Good week ahead.</div>
      )}

      <button className="btn" style={{ marginTop: 8, fontSize: 11 }} onClick={() => setDone({})}>Reset checklist</button>

      <hr className="divider" />

      <div className="snapshot-label">System snapshot</div>
      <div className="snapshot-grid">
        {[
          { label: 'Inbox', val: inbox.length, warn: inbox.length > 5 },
          { label: 'Active Projects', val: projects.filter(p => p.status === '🟢 Active').length },
          { label: 'Someday', val: someday.length },
          { label: 'No Next Action', val: noNextAction, warn: noNextAction > 0 },
          { label: 'Waiting', val: projects.filter(p => p.status === '⏳ Waiting').length },
          { label: 'Done', val: projects.filter(p => p.status === '✅ Done').length },
        ].map(s => (
          <div className="snapshot-card" key={s.label}>
            <div className={`snapshot-num${s.warn && s.val > 0 ? ' warn' : ''}`}>{s.val}</div>
            <div className="snapshot-sub">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState('Inbox')
  const [inbox, setInbox] = useState([])
  const [projects, setProjects] = useState([])
  const [someday, setSomeday] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const [i, p, s] = await Promise.all([getInbox(), getProjects(), getSomeday()])
      setInbox(i); setProjects(p); setSomeday(s)
    } catch (e) {
      setError('Could not connect to database. Check your Supabase environment variables.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Seed default projects if empty
  useEffect(() => {
    if (!loading && projects.length === 0 && !error) {
      Promise.all(DEFAULT_PROJECTS.map(p => addProject(p))).then(load)
    }
  }, [loading, projects.length, error, load])

  async function handleAddInbox(text) {
    const item = await addInboxItem(text)
    setInbox(prev => [item, ...prev])
  }

  async function handleDeleteInbox(id) {
    await deleteInboxItem(id)
    setInbox(prev => prev.filter(i => i.id !== id))
  }

  async function handleMoveToSomeday(item) {
    const newItem = await addSomedayItem(item.text)
    setSomeday(prev => [newItem, ...prev])
    await handleDeleteInbox(item.id)
  }

  async function handleProcessToProject(item, projectId, actionText) {
    const updated = await updateProject(projectId, { next_action: actionText || item.text })
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
    await handleDeleteInbox(item.id)
  }

  async function handleAddProject(proj) {
    const newProj = await addProject(proj)
    setProjects(prev => [...prev, newProj])
  }

  async function handleUpdateProject(id, updates) {
    // Optimistic update
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    try {
      await updateProject(id, updates)
    } catch {
      load() // revert on error
    }
  }

  async function handleDeleteProject(id) {
    setProjects(prev => prev.filter(p => p.id !== id))
    await deleteProject(id)
  }

  async function handleActivateSomeday(item) {
    const newProj = await addProject({ name: item.text, outcome: '', next_action: '', area: 'Work', status: '🟢 Active' })
    setProjects(prev => [...prev, newProj])
    setSomeday(prev => prev.filter(i => i.id !== item.id))
    await deleteSomedayItem(item.id)
  }

  async function handleDeleteSomeday(id) {
    setSomeday(prev => prev.filter(i => i.id !== id))
    await deleteSomedayItem(id)
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="header-top">
            <span className="header-eyebrow">GTD /</span>
            <h1 className="header-title">Getting Things Done</h1>
          </div>
          <div className="tabs">
            {TABS.map(t => (
              <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t}
                {t === 'Inbox' && inbox.length > 0 && <span className="tab-badge">{inbox.length}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="content">
          {error && <div className="error-banner">⚠ {error}</div>}
          {loading ? (
            <div className="loading">Loading your system...</div>
          ) : (
            <>
              {tab === 'Inbox' && (
                <InboxTab
                  inbox={inbox} projects={projects}
                  onAdd={handleAddInbox} onDelete={handleDeleteInbox}
                  onMoveToSomeday={handleMoveToSomeday}
                  onProcessToProject={handleProcessToProject}
                />
              )}
              {tab === 'Projects' && (
                <ProjectsTab
                  projects={projects}
                  onAdd={handleAddProject}
                  onUpdate={handleUpdateProject}
                  onDelete={handleDeleteProject}
                />
              )}
              {tab === 'Someday' && (
                <SomedayTab someday={someday} onActivate={handleActivateSomeday} onDelete={handleDeleteSomeday} />
              )}
              {tab === 'Review' && (
                <ReviewTab inbox={inbox} projects={projects} someday={someday} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
