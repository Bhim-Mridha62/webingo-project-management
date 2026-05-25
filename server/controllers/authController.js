const {
  formatAuthResponse,
  createUser,
  authenticateUser,
  refreshTokens,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  requestPasswordReset,
  resetPassword,
} = require('../services/authService');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const result = await createUser({ name, email, password });

  if (!result) {
    return res.status(400).json({ message: 'User already exists' });
  }

  res.status(201).json(formatAuthResponse(result.user, result.tokens));
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authenticateUser({ email, password });

  if (!result) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json(formatAuthResponse(result.user, result.tokens));
};

exports.refreshToken = async (req, res) => {
  const { token } = req.body;
  const tokens = await refreshTokens(token);

  if (!tokens) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  res.json(tokens);
};

exports.logout = async (req, res) => {
  await logoutUser(req.user._id);
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  const user = await getUserProfile(req.user._id);
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await updateUserProfile(req.user._id, req.body, req.file);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const result = await requestPasswordReset(email);
  if (!result) {
    return res.status(404).json({ message: 'No user with that email' });
  }
  res.json({ message: 'Password reset email sent' });
};

exports.resetPassword = async (req, res) => {
  const result = await resetPassword(req.params.token, req.body.password);
  if (!result) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  res.json({ message: 'Password reset successful' });
};
