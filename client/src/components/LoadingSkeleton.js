import React from 'react';

const LoadingSkeleton = ({ type = 'card', count = 3 }) => {
  if (type === 'card') {
    return (
      <div className="project-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'task') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 14 }}>
            <div className="skeleton skeleton-text" style={{ width: '70%' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 12 }} />
              <div className="skeleton" style={{ width: 50, height: 20, borderRadius: 12 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 8 }} />
            <div>
              <div className="skeleton" style={{ width: 60, height: 28, marginBottom: 4 }} />
              <div className="skeleton" style={{ width: 80, height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default LoadingSkeleton;
