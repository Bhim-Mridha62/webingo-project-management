export const getToken = () => localStorage.getItem('token');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const clearAuthTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
};
export const isAuthenticated = () => Boolean(getToken());
