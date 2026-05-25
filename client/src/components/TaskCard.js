import React from 'react';
import { Calendar, Paperclip, Edit3, Trash2 } from 'lucide-react';
import { getDueStatus } from '../utils/dateUtils';
import { motion } from 'framer-motion';

const TaskCard = ({
  task,
  myRole,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
}) => {
  const isDraggable = myRole === 'Admin' || myRole === 'Team Member';

  const coverImage = task.attachments?.find(att =>
    att.original_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || att.url?.match(/\.(jpeg|jpg|gif|png|webp)/i)
  );

  const dueStatus = task.dueDate ? getDueStatus(task.dueDate) : null;
  const isExpired = dueStatus === 'Expired';
  const isDueSoon = dueStatus === 'Last day' || dueStatus === '1 day left';

  return (
    <motion.div
      layoutId={task._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)', borderColor: 'rgba(108, 99, 255, 0.4)' }}
      transition={{ duration: 0.2 }}
      draggable={isDraggable}
      onDragStart={(e) => onDragStart(e, task._id)}
      onDragEnd={onDragEnd}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px',
        cursor: isDraggable ? 'grab' : 'default',
        overflow: 'hidden'
      }}
    >
      {coverImage && (
        <img
          src={coverImage.url}
          alt="Cover"
          style={{
            width: 'calc(100% + 28px)',
            margin: '-14px -14px 12px -14px',
            height: '110px',
            objectFit: 'cover',
            borderTopLeftRadius: 'var(--radius-sm)',
            borderTopRightRadius: 'var(--radius-sm)',
            display: 'block'
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{
            marginTop: 4,
            accentColor: 'var(--accent-primary)',
            cursor: 'pointer',
            width: '15px',
            height: '15px'
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="task-card-title"
            onClick={onEdit}
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--text-primary)',
              marginBottom: '6px',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={task.title}
          >
            {task.title}
          </div>

          <div className="task-card-meta" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
            <span className={`badge badge-${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span
                style={{
                  fontSize: 11,
                  color: isExpired ? 'var(--accent-secondary)' : isDueSoon ? 'var(--accent-warning)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: isExpired || isDueSoon ? 600 : 500
                }}
              >
                <Calendar size={11} />
                {dueStatus}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div className="task-card-assignees" style={{ display: 'flex', alignItems: 'center' }}>
              {task.assignees?.slice(0, 3).map((a, i) => (
                <div
                  key={i}
                  className="task-card-assignee"
                  title={a.name || 'User'}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-info), var(--accent-primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'white',
                    border: '2px solid var(--bg-card)',
                    marginLeft: i > 0 ? '-6px' : '0',
                    zIndex: 3 - i,
                    overflow: 'hidden'
                  }}
                >
                  {a.profilePicture ? (
                    <img
                      src={a.profilePicture}
                      alt={a.name || 'Assignee'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    a.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
              ))}
              {task.assignees?.length > 3 && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    border: '2px solid var(--bg-card)',
                    marginLeft: '-6px',
                    zIndex: 0
                  }}
                  title={`${task.assignees.length - 3} more assignees`}
                >
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {task.attachments?.length > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    marginRight: '4px'
                  }}
                  title={`${task.attachments.length} attachments`}
                >
                  <Paperclip size={11} /> {task.attachments.length}
                </span>
              )}
              {(myRole === 'Admin' || myRole === 'Team Member') && (
                <>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={onEdit}
                    title="Edit Task"
                    style={{ padding: '4px', borderRadius: '4px' }}
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                    title="Delete Task"
                    style={{ padding: '4px', borderRadius: '4px', color: 'var(--accent-secondary)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
