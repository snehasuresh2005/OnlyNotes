import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { shared as sharedApi } from '../services/api'

export default function SharedPage() {
  const { shareId } = useParams()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    sharedApi.get(shareId)
      .then(d => setNote(d.note))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [shareId])

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
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>')
  }

  if (loading) return (
    <div className="share-page">
      <div className="skeleton" style={{height:400,borderRadius:12}} />
    </div>
  )

  if (error) return (
    <div className="share-page">
      <div className="empty-state">
        <div className="icon">🔒</div>
        <h3>Note Not Found</h3>
        <p>{error}</p>
      </div>
    </div>
  )

  return (
    <div className="share-page">
      <div className="share-header">
        <div style={{fontSize:28,fontWeight:800,fontFamily:'var(--font-heading)',background:'linear-gradient(135deg,#6C63FF,#ff6b6b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:8}}>
          ✦ OnlyNotes
        </div>
        <p style={{color:'var(--text-muted)',fontSize:14}}>Shared by {note?.author_name}</p>
      </div>

      <div className="share-content">
        <h1 style={{fontSize:28,marginBottom:8}}>{note?.title}</h1>
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          <span style={{fontSize:12,color:'var(--text-muted)'}}>
            {new Date(note?.updated_at).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})}
          </span>
          {note?.tags?.map(t => (
            <span key={t.id} className="tag-pill" style={{background:t.color+'22',color:t.color}}>{t.name}</span>
          ))}
        </div>
        <div className="markdown-preview" dangerouslySetInnerHTML={{__html: renderMarkdown(note?.content)}} />

        {note?.ai_summary && (
          <div style={{marginTop:32,padding:20,background:'var(--bg-primary)',borderRadius:12}}>
            <h3 style={{fontSize:16,marginBottom:12}}>✨ AI Summary</h3>
            <p style={{fontSize:14,lineHeight:1.7,color:'var(--text-secondary)'}}>{note.ai_summary}</p>
            {note.ai_action_items?.length > 0 && (
              <>
                <h4 style={{fontSize:14,marginTop:16,marginBottom:8}}>✅ Action Items</h4>
                <ul style={{paddingLeft:20}}>{note.ai_action_items.map((a,i) => <li key={i} style={{fontSize:14,marginBottom:4,color:'var(--text-secondary)'}}>{a}</li>)}</ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
