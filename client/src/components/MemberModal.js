import React from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';

const MemberModal = ({
  isOpen,
  onClose,
  submitting,
  onSubmit
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleFormSubmit = (data) => {
    onSubmit({
      memberEmail: data.memberEmail,
      memberRole: data.memberRole,
    });
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Team Member"
      footer={
        <>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            type="button" 
            onClick={handleSubmit(handleFormSubmit)}
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Member'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="form-group">
          <label className="form-label">Member Email *</label>
          <input 
            className="form-input" 
            placeholder="email@example.com" 
            type="email"
            {...register('memberEmail', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })} 
          />
          {errors.memberEmail && <div className="form-error">{errors.memberEmail.message}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-input form-select" {...register('memberRole')}>
            <option value="Team Member">Team Member</option>
            <option value="Viewer">Viewer</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default MemberModal;
