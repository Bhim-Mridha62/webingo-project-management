import React from 'react';
import { Calendar, Paperclip, Edit3, Trash2, ArrowUpDown } from 'lucide-react';
import { getDueStatus } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

const TaskListView = ({
  tasks,
  myRole,
  selectedTasks,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}) => {
  const isAllSelected = tasks.length > 0 && tasks.every(t => selectedTasks.includes(t._id));
  const isSomeSelected = tasks.length > 0 && tasks.some(t => selectedTasks.includes(t._id)) && !isAllSelected;

  const handleHeaderClick = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown size={12} style={{ marginLeft: 4, opacity: 0.3 }} />;
    return (
      <ArrowUpDown 
        size={12} 
        style={{ 
          marginLeft: 4, 
          color: 'var(--accent-primary)',
          transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
          transition: 'var(--transition)'
        }} 
      />
    );
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px 20px', width: '50px' }}>
                <input
                  type="checkbox"
                  ref={el => {
                    if (el) {
                      el.indeterminate = isSomeSelected;
                    }
                  }}
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer', width: '15px', height: '15px' }}
                />
              </th>
              
              {/* Task Title Header */}
              <th 
                onClick={() => handleHeaderClick('title')}
                style={{ padding: '16px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Task Title {renderSortIcon('title')}
                </div>
              </th>

              {/* Status Header */}
              <th 
                onClick={() => handleHeaderClick('status')}
                style={{ padding: '16px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '140px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Status {renderSortIcon('status')}
                </div>
              </th>

              {/* Priority Header */}
              <th 
                onClick={() => handleHeaderClick('priority')}
                style={{ padding: '16px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '130px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Priority {renderSortIcon('priority')}
                </div>
              </th>

              {/* Due Date Header */}
              <th 
                onClick={() => handleHeaderClick('dueDate')}
                style={{ padding: '16px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '150px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Due Date {renderSortIcon('dueDate')}
                </div>
              </th>

              {/* Assignees Header */}
              <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '150px' }}>
                Assignees
              </th>

              {/* Actions Header */}
              <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '100px', textAlign: 'center' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No tasks found matching current filters
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const dueStatus = task.dueDate ? getDueStatus(task.dueDate) : null;
                  const isExpired = dueStatus === 'Expired';
                  const isDueSoon = dueStatus === 'Last day' || dueStatus === '1 day left';
                  const hasAttachments = task.attachments?.length > 0;

                  return (
                    <motion.tr
                      key={task._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: selectedTasks.includes(task._id) ? 'rgba(108, 99, 255, 0.03)' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                      className="task-list-row"
                    >
                      {/* Checkbox Cell */}
                      <td style={{ padding: '14px 20px' }}>
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task._id)}
                          onChange={() => onToggleSelect(task._id)}
                          style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                      </td>

                      {/* Title & Description Cell */}
                      <td style={{ padding: '14px 20px' }}>
                        <div 
                          onClick={() => onEdit(task)} 
                          style={{ 
                            fontWeight: 600, 
                            color: 'var(--text-primary)', 
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span className="hover-underline">{task.title}</span>
                          {hasAttachments && (
                            <span title={`${task.attachments.length} files attachment`} style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                              <Paperclip size={12} />
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.description}
                          </div>
                        )}
                      </td>

                      {/* Status Cell */}
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge badge-${task.status.toLowerCase().replace(' ', '-')}`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Priority Cell */}
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Due Date Cell */}
                      <td style={{ padding: '14px 20px' }}>
                        {task.dueDate ? (
                          <span 
                            style={{ 
                              fontSize: '13px',
                              color: isExpired ? 'var(--accent-secondary)' : isDueSoon ? 'var(--accent-warning)' : 'var(--text-secondary)',
                              fontWeight: isExpired || isDueSoon ? 600 : 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Calendar size={13} />
                            {dueStatus}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                        )}
                      </td>

                      {/* Assignees Cell */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {task.assignees?.slice(0, 4).map((a, i) => (
                            <div 
                              key={i} 
                              className="task-card-assignee" 
                              title={a.name || 'User'}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-info), var(--accent-primary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: 'white',
                                border: '2px solid var(--bg-secondary)',
                                marginLeft: i > 0 ? '-6px' : '0',
                                zIndex: 4 - i
                              }}
                            >
                              {a.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          ))}
                          {task.assignees?.length > 4 && (
                            <div 
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                border: '2px solid var(--bg-secondary)',
                                marginLeft: '-6px',
                                zIndex: 0
                              }}
                              title={`${task.assignees.length - 4} more assignees`}
                            >
                              +{task.assignees.length - 4}
                            </div>
                          )}
                          {(!task.assignees || task.assignees.length === 0) && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Actions Cell */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-icon btn-ghost btn-sm" 
                            onClick={() => onEdit(task)} 
                            title="Edit"
                            style={{ padding: '6px' }}
                          >
                            <Edit3 size={13} />
                          </button>
                          {(myRole === 'Admin' || myRole === 'Team Member') && (
                            <button 
                              className="btn btn-icon btn-ghost btn-sm" 
                              onClick={() => onDelete(task._id)} 
                              title="Delete"
                              style={{ padding: '6px', color: 'var(--accent-secondary)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskListView;
