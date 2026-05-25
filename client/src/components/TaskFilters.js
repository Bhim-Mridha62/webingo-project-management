import React from 'react';
import { Search, Grid, List, Trash2, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const TaskFilters = ({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterAssignee,
  setFilterAssignee,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  projectMembers = [],
  selectedTasksCount = 0,
  onBulkStatusUpdate,
  onBulkDelete
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
      <div className="filters-bar">
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            className="filter-input"
            style={{
              paddingLeft: 36,
              width: '100%',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              height: '40px'
            }}
            placeholder="Search by title/description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter by Status */}
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ height: '40px', minWidth: '130px', background: 'var(--bg-secondary)' }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Filter by Priority */}
        <select
          className="filter-select"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{ height: '40px', minWidth: '130px', background: 'var(--bg-secondary)' }}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Filter by Assignee */}
        <select
          className="filter-select"
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          style={{ height: '40px', minWidth: '150px', background: 'var(--bg-secondary)' }}
        >
          <option value="">All Assignees</option>
          {projectMembers.map(m => (
            <option key={m.user?._id} value={m.user?._id}>
              {m.user?.name || 'User'}
            </option>
          ))}
        </select>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ height: '40px', minWidth: '140px', background: 'var(--bg-secondary)' }}
          >
            <option value="">No Sorting</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
          </select>
          {sortBy && (
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="btn btn-ghost btn-icon"
              title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
              style={{
                height: '40px',
                width: '40px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              <ArrowUpDown size={16} style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none', transition: 'var(--transition)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Bulk Operations Bar */}
      {selectedTasksCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(108, 99, 255, 0.05)',
            border: '1px solid rgba(108, 99, 255, 0.2)',
            borderRadius: 'var(--radius-sm)',
            width: '100%',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
            {selectedTasksCount} task{selectedTasksCount > 1 ? 's' : ''} selected
          </span>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', alignItems: 'center' }}>
            <select
              className="filter-select"
              onChange={(e) => {
                if (e.target.value) {
                  onBulkStatusUpdate(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              style={{ height: '36px', fontSize: '12px', background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <option value="">Move Status To...</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button
              className="btn btn-danger btn-sm"
              onClick={onBulkDelete}
              style={{ height: '36px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={13} /> Delete Selected
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TaskFilters;
