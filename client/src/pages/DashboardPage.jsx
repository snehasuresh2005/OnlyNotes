import { useState, useEffect } from 'react'
import { insights as insightsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    insightsApi.get()
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  }

  if (loading) return (
    <div>
      <div className="page-header"><h1>📊 Dashboard</h1></div>
      <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{height:120,borderRadius:12}} />)}</div>
    </div>
  )

  const maxActivity = Math.max(...(data?.weeklyActivity?.map(d => d.count) || [1]), 1)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p style={{color:'var(--text-muted)',marginTop:4,fontSize:14}}>Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{data?.totalNotes || 0}</div>
          <div className="stat-label">Active Notes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{data?.archivedNotes || 0}</div>
          <div className="stat-label">Archived</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-value">{data?.sharedNotes || 0}</div>
          <div className="stat-label">Shared Notes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-value">{data?.aiUsage?.total || 0}</div>
          <div className="stat-label">AI Analyses</div>
        </div>
      </div>

      <div className="insights-grid">
        <div className="card">
          <h3 style={{marginBottom:16}}>📈 Weekly Activity</h3>
          {data?.weeklyActivity?.length > 0 ? (
            <div className="activity-chart">
              {data.weeklyActivity.map((day, i) => (
                <div key={i} className="activity-bar"
                  style={{height: `${(day.count / maxActivity) * 100}%`}}
                  title={`${day.count} notes`}>
                  <span className="bar-label">{getDayLabel(day.date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{color:'var(--text-muted)',fontSize:13,padding:20,textAlign:'center'}}>No activity this week yet</p>
          )}
        </div>

        <div className="card">
          <h3 style={{marginBottom:16}}>🏷️ Top Tags</h3>
          {data?.topTags?.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {data.topTags.map((tag, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                  <span className="tag-pill" style={{background: tag.color + '22', color: tag.color}}>
                    {tag.name}
                  </span>
                  <div style={{flex:1,height:6,background:'var(--bg-primary)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{width:`${(tag.usage_count / Math.max(...data.topTags.map(t=>t.usage_count),1))*100}%`,height:'100%',background:tag.color,borderRadius:3,transition:'width 0.5s ease'}} />
                  </div>
                  <span style={{fontSize:12,color:'var(--text-muted)',minWidth:30,textAlign:'right'}}>{tag.usage_count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{color:'var(--text-muted)',fontSize:13,padding:20,textAlign:'center'}}>No tags created yet</p>
          )}
        </div>

        <div className="card">
          <h3 style={{marginBottom:16}}>📂 Categories</h3>
          {data?.notesByCategory?.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {data.notesByCategory.map((cat, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--bg-primary)',borderRadius:8}}>
                  <span style={{fontWeight:600,fontSize:14,textTransform:'capitalize'}}>{cat.category}</span>
                  <span style={{background:'var(--accent-bg)',color:'var(--accent)',padding:'2px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>{cat.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{color:'var(--text-muted)',fontSize:13,padding:20,textAlign:'center'}}>No notes yet</p>
          )}
        </div>

        <div className="card">
          <h3 style={{marginBottom:16}}>🕐 Recent Notes</h3>
          {data?.recentNotes?.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {data.recentNotes.slice(0, 5).map((n, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--bg-primary)',borderRadius:8}}>
                  <span style={{fontSize:14}}>{n.title || 'Untitled'}</span>
                  <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)',whiteSpace:'nowrap'}}>
                    {new Date(n.updated_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{color:'var(--text-muted)',fontSize:13,padding:20,textAlign:'center'}}>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}
