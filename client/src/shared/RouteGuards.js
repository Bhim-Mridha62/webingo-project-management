import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/authHelpers';

export const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export const PublicOnlyRoute = ({ children }) => {
    return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
};
