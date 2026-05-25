import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { setUser } from '../store/slices/authSlice';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePicture || '');
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPreviewUrl(user?.profilePicture || '');
    setSelectedFile(null);
  }, [user, reset]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      if (selectedFile) formData.append('profilePicture', selectedFile);
      if (data.newPassword) {
        formData.append('currentPassword', data.currentPassword);
        formData.append('newPassword', data.newPassword);
      }

      const response = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch(setUser(response.data));
      toast('Profile updated successfully', 'success');
      reset({
        name: response.data.name,
        email: response.data.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSelectedFile(null);
      setPreviewUrl(response.data.profilePicture || '');
    } catch (error) {
      toast(error.response?.data?.message || 'Unable to update profile', 'error');
    }
  };

  const renderAvatar = () => {
    if (previewUrl) {
      return (
        <img
          src={previewUrl}
          alt="Profile"
          style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }}
        />
      );
    }
    const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    return (
      <div style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 32,
        fontWeight: 700
      }}>
        {initials}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Update your profile, email, password, and profile picture.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 760, padding: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', flexDirection: "column" }}>
          <div
            style={{
              minWidth: 180,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {renderAvatar()}

            {/* Upload Button */}
            <label
              style={{
                marginTop: 14,
                padding: '10px 16px',
                borderRadius: 10,
                background: 'var(--accent-primary)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              Change Photo
            </label>

            {/* Helper Text */}
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.4,
              }}
            >
              PNG, JPG, WEBP <br />
              Up to 5MB
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 320 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Account Settings</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  {...register('name', { required: 'Name is required' })}
                  placeholder="Full name"
                />
                {errors.name && <div className="form-error">{errors.name.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email address' }
                  })}
                  placeholder="Email address"
                  readOnly
                />
                {errors.email && <div className="form-error">{errors.email.message}</div>}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Change Password</h4>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                Leave password fields empty if you do not want to change your password.
              </div>

              <div className="form-group">
                <label className="form-label">Current password</label>
                <input
                  className="form-input"
                  type="password"
                  {...register('currentPassword', {
                    validate: value => !newPassword || value.length > 0 || 'Current password is required to change password'
                  })}
                  placeholder="Current password"
                />
                {errors.currentPassword && <div className="form-error">{errors.currentPassword.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">New password</label>
                <input
                  className="form-input"
                  type="password"
                  {...register('newPassword', {
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                  })}
                  placeholder="New password"
                />
                {errors.newPassword && <div className="form-error">{errors.newPassword.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input
                  className="form-input"
                  type="password"
                  {...register('confirmPassword', {
                    validate: value => !newPassword || value === newPassword || 'Passwords do not match'
                  })}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword.message}</div>}
              </div>

              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
