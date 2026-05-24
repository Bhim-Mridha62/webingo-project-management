import React from 'react';

const SettingsPage = () => {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account preferences</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 600 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Account Settings</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Account settings and profile management features will be available soon.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
