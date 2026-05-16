import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { notes as notesApi, tags as tagsApi } from '../services/api'

const CATEGORIES = ['uncategorized', 'work', 'personal', 'ideas', 'meeting']

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('uncategorized')
  const [allTags, setAllTags] = useState([])
  const [noteTags, setNoteTags] = useState([])
  const [saveStatus, setSaveStatus] = useState('saved')
  const [aiLoading, setAiLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const saveTimer = useRef(null)

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const data = await notesApi.get(id)
        setNote(data.note)
        setTitle(data.note.title)
        setContent(data.note.content)
        setCategory(data.note.category)
        setNoteTags(data.note.tags?.map(t => t.id) || [])
        if (data.note.is_public && data.note.share_id) {
          setShareUrl(`${window.location.origin}/shared/${data.note.share_id}`)
        }
      } catch { navigate('/notes') }
    }
    fetchNote()
    tagsApi.list().then(d => setAllTags(d.tags)).catch(() => {})
  }, [id])

  const autoSave = useCallback(async (updates) => {
    setSaveStatus('saving')
    try {
      const data = await notesApi.update(id, updates)
      setNote(data.note)
      setSaveStatus('saved')
    } catch { setSaveStatus('error') }
  }, [id])

  const debouncedSave = useCallback((updates) => {
    setSaveStatus('editing')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autoSave(updates), 800)
  }, [autoSave])

  const handleTitleChange = (val) => { setTitle(val); debouncedSave({ title: val, content, category, tags: noteTags }) }
  const handleContentChange = (val) => { setContent(val); debouncedSave({ title, content: val, category, tags: noteTags }) }
  const handleCategoryChange = (val) => { setCategory(val); autoSave({ title, content, category: val, tags: noteTags }) }
  const handleTagToggle = (tagId) => {
    const newTags = noteTags.includes(tagId) ? noteTags.filter(t => t !== tagId) : [...noteTags, tagId]
    setNoteTags(newTags)
    autoSave({ title, content, category, tags: newTags })
  }

  const handleAiGenerate = async () => {
    setAiLoading(true)
    try {
      const data = await notesApi.generateSummary(id)
      setNote(data.note)
    } catch (err) { alert(err.message) }
    finally { setAiLoading(false) }
  }

  const handleShare = async () => {
    try {
      const data = await notesApi.share(id)
      setNote(data.note)
      if (data.note.is_public) {
        const url = `${window.location.origin}/shared/${data.note.share_id}`
        setShareUrl(url)
        navigator.clipboard?.writeText(url)
        alert('Share link copied!')
      } else { setShareUrl('') }
    } catch (err) { alert(err.message) }
  }

  const handleApplyTitle = () => {
    if (note?.ai_suggested_title) {
      setTitle(note.ai_suggested_title)
      autoSave({ title: note.ai_suggested_title, content, category, tags: noteTags })
    }
  }

  const renderMarkdown = (text) => {
    if (!text) return ''
    return text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>')
  }

  useEffect(() => {
    const handleKeyboard = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); autoSave({ title, content, category, tags: noteTags }) }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [title, content, category, noteTags, autoSave])

  if (!note) return <div style={{padding:40}}><div className="skeleton" style={{height:400,borderRadius:12}} /></div>

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/notes')}>← Back to Notes</button>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span className={`save-indicator ${saveStatus}`}>
            {saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'saved' ? '✅ Saved' : saveStatus === 'editing' ? '✏️ Editing...' : '❌ Error'}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleShare}>
            {note.is_public ? '🔒 Unshare' : '🔗 Share'}
          </button>
        </div>
      </div>

      {shareUrl && (
        <div style={{background:'var(--accent-bg)',padding:'10px 16px',borderRadius:8,marginBottom:16,display:'flex',alignItems:'center',gap:8,fontSize:13}}>
          🔗 <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis'}}>{shareUrl}</span>
          <button className="btn btn-sm btn-primary" onClick={() => {navigator.clipboard?.writeText(shareUrl); alert('Copied!')}}>Copy</button>
        </div>
      )}

      <div className="editor-container">
        <div className="editor-main">
          <div className="editor-toolbar">
            <select value={category} onChange={e => handleCategoryChange(e.target.value)} style={{padding:'6px 12px',borderRadius:20,fontSize:12,fontWeight:600}}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {allTags.map(t => (
                <button key={t.id}
                  className={`filter-chip ${noteTags.includes(t.id) ? 'active' : ''}`}
                  style={{padding:'4px 10px',fontSize:11,...(noteTags.includes(t.id) ? {borderColor:t.color,background:t.color+'22',color:t.color} : {})}}
                  onClick={() => handleTagToggle(t.id)}>
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
          <input className="editor-title-input" value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Note title..." />
          {showPreview ? (
            <div className="markdown-preview" dangerouslySetInnerHTML={{__html: renderMarkdown(content)}} />
          ) : (
            <textarea className="editor-textarea" value={content} onChange={e => handleContentChange(e.target.value)}
              placeholder="Start writing your note... (Supports markdown)" />
          )}
        </div>

        <div className="ai-panel">
          <div className="ai-panel-header">
            ✨ AI Analysis <span className="ai-badge">SMART</span>
          </div>
          <button className="btn btn-primary" onClick={handleAiGenerate} disabled={aiLoading} style={{width:'100%'}}>
            {aiLoading ? '⏳ Analyzing...' : '🧠 Generate Analysis'}
          </button>

          {note.ai_summary && (
            <>
              <div className="ai-section">
                <h4>📋 Summary</h4>
                <p>{note.ai_summary}</p>
              </div>
              {note.ai_action_items?.length > 0 && (
                <div className="ai-section">
                  <h4>✅ Action Items</h4>
                  <ul>{note.ai_action_items.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
              )}
              {note.ai_suggested_title && (
                <div className="ai-section">
                  <h4>💡 Suggested Title</h4>
                  <div className="ai-suggested-title" onClick={handleApplyTitle} title="Click to apply">
                    {note.ai_suggested_title}
                  </div>
                </div>
              )}
            </>
          )}

          {!note.ai_summary && !aiLoading && (
            <div style={{textAlign:'center',padding:20,color:'var(--text-muted)',fontSize:13}}>
              <p>Write some content, then click "Generate Analysis" to get AI-powered insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
