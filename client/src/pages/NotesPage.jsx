import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notes as notesApi, tags as tagsApi } from '../services/api'

const CATEGORIES = ['all', 'uncategorized', 'work', 'personal', 'ideas', 'meeting']

export default function NotesPage({ archived = false }) {
  const [notesList, setNotesList] = useState([])
  const [tagsList, setTagsList] = useState([])
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [sort, setSort] = useState('updated')
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState('')
  const [showTagModal, setShowTagModal] = useState(false)
  const navigate = useNavigate()

  const fetchNotes = async () => {
    try {
      const params = { sort, archived: archived ? 'true' : 'false' }
      if (search) params.search = search
      if (filterTag) params.tag = filterTag
      if (filterCat && filterCat !== 'all') params.category = filterCat
      const data = await notesApi.list(params)
      setNotesList(data.notes)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchTags = async () => {
    try {
      const data = await tagsApi.list()
      setTagsList(data.tags)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchNotes(); fetchTags() }, [search, filterTag, filterCat, sort, archived])

  const handleCreate = async () => {
    try {
      const data = await notesApi.create({ title: 'Untitled', content: '', category: filterCat !== 'all' ? filterCat : 'uncategorized' })
      navigate(`/notes/${data.note.id}`)
    } catch (err) { console.error(err) }
  }

  const handleCreateTag = async (e) => {
    e.preventDefault()
    if (!newTag.trim()) return
    try {
      await tagsApi.create(newTag.trim())
      setNewTag('')
      setShowTagModal(false)
      fetchTags()
    } catch (err) { alert(err.message) }
  }

  const handleArchive = async (e, id) => {
    e.stopPropagation()
    try { await notesApi.archive(id); fetchNotes() }
    catch (err) { console.error(err) }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this note?')) return
    try { await notesApi.delete(id); fetchNotes() }
    catch (err) { console.error(err) }
  }

  const formatDate = (d) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div>
      <div className="page-header">
        <h1>{archived ? '📦 Archive' : '📝 Notes'}</h1>
        {!archived && (
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowTagModal(true)}>🏷️ Tags</button>
            <button className="btn btn-primary" onClick={handleCreate}>+ New Note</button>
          </div>
        )}
      </div>

      <div className="search-bar" style={{marginBottom: 24}}>
        <div className="search-input-wrap">
          <span className="icon">🔍</span>
          <input placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-chip" value={sort} onChange={e => setSort(e.target.value)} style={{cursor:'pointer'}}>
          <option value="updated">Recent</option>
          <option value="oldest">Oldest</option>
          <option value="alpha">A-Z</option>
          <option value="created">Created</option>
        </select>
      </div>

      <div className="filter-chips" style={{marginBottom: 20}}>
        {CATEGORIES.map(c => (
          <button key={c} className={`filter-chip ${filterCat === c ? 'active' : ''}`}
            onClick={() => setFilterCat(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        {tagsList.map(t => (
          <button key={t.id} className={`filter-chip ${filterTag === t.id ? 'active' : ''}`}
            onClick={() => setFilterTag(filterTag === t.id ? '' : t.id)}
            style={filterTag === t.id ? {borderColor: t.color, background: t.color + '22', color: t.color} : {}}>
            #{t.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="board-container">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{height:180,borderRadius:12}} />)}
        </div>
      ) : notesList.length === 0 ? (
        <div className="empty-state">
          <div className="icon">{archived ? '📦' : '📝'}</div>
          <h3>{archived ? 'No archived notes' : 'No notes yet'}</h3>
          <p>{archived ? 'Archived notes will appear here' : 'Create your first note to get started'}</p>
          {!archived && <button className="btn btn-primary" onClick={handleCreate}>+ Create Note</button>}
        </div>
      ) : (
        <div className="board-container">
          {notesList.map(note => (
            <div key={note.id} className={`note-card cat-${note.category}`} onClick={() => navigate(`/notes/${note.id}`)}>
              <div className="note-title">{note.title || 'Untitled'}</div>
              {note.tags?.length > 0 && (
                <div className="note-tags">
                  {note.tags.map(t => (
                    <span key={t.id} className="tag-pill" style={{background: t.color + '22', color: t.color}}>
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="note-preview">{note.content || 'Empty note...'}</div>
              <div className="note-meta">
                <span>{formatDate(note.updated_at)}</span>
                <div style={{display:'flex',gap:4}}>
                  {note.ai_summary && <span title="AI analyzed">✨</span>}
                  {note.is_public && <span title="Shared">🔗</span>}
                  <button className="btn-icon btn-ghost" title={archived ? 'Unarchive' : 'Archive'}
                    onClick={e => handleArchive(e, note.id)} style={{fontSize:14,padding:4}}>
                    {archived ? '📤' : '📦'}
                  </button>
                  <button className="btn-icon btn-ghost" title="Delete"
                    onClick={e => handleDelete(e, note.id)} style={{fontSize:14,padding:4}}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTagModal && (
        <div className="modal-overlay" onClick={() => setShowTagModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🏷️ Manage Tags</h3>
            <form onSubmit={handleCreateTag} style={{display:'flex',gap:8,marginBottom:16}}>
              <input placeholder="New tag name..." value={newTag} onChange={e => setNewTag(e.target.value)} style={{flex:1}} />
              <button className="btn btn-primary btn-sm" type="submit">Add</button>
            </form>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {tagsList.map(t => (
                <span key={t.id} className="tag-pill" style={{background: t.color + '22', color: t.color}}>
                  {t.name}
                  <button onClick={async () => { await tagsApi.delete(t.id); fetchTags() }}
                    style={{background:'none',border:'none',cursor:'pointer',marginLeft:4,color:'inherit',fontSize:12}}>✕</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
