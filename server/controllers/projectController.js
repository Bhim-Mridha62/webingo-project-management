// Update and delete project, get activity log, invitation
const Project = require('../models/Project');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');
const { sendInvitationEmail, sendProjectMemberEmail } = require('../services/emailService');

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });

    await ActivityLog.create({
      project: project._id,
      user: req.user._id,
      action: 'project_created',
      details: `Project "${project.name}" created`,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      'members.user': req.user._id
    }).populate('members.user', 'name email profilePicture');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = req.project; // from authorizeProjectRole middleware
    const { name, description, status } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();
    await project.populate('members.user', 'name email profilePicture');

    await ActivityLog.create({
      project: project._id,
      user: req.user._id,
      action: 'project_updated',
      details: `Project "${project.name}" updated`,
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = req.project;
    await Project.findByIdAndDelete(project._id);

    // Also delete all tasks in this project
    const Task = require('../models/Task');
    await Task.deleteMany({ project: project._id });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = req.project;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found. They must register first.' });

    const isMember = project.members.find(m => (m.user._id || m.user).toString() === user._id.toString());
    if (isMember) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: user._id, role: role || 'Viewer' });
    await project.save();
    await project.populate('members.user', 'name email profilePicture');

    await ActivityLog.create({
      project: project._id,
      user: req.user._id,
      action: 'member_added',
      details: `${user.name} added as ${role || 'Viewer'}`,
    });

    req.io.to(`user_${user._id}`).emit('notification', {
      title: 'Added to project',
      message: `You were added to "${project.name}" as ${role || 'Viewer'}`,
      type: 'info',
      timestamp: Date.now(),
    });

    sendProjectMemberEmail(user.email, req.user.name, project.name, role || 'Viewer').catch(() => { });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const project = req.project;

    if (memberId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove yourself from the project' });
    }

    project.members = project.members.filter(m => (m.user._id || m.user).toString() !== memberId);
    await project.save();

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendInvitation = async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = req.project;

    // Check if invitation already exists
    const existing = await Invitation.findOne({ email, project: project._id, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'Invitation already sent to this email' });

    const token = crypto.randomBytes(32).toString('hex');

    await Invitation.create({
      project: project._id,
      email,
      role: role || 'Viewer',
      token,
      invitedBy: req.user._id,
    });

    const inviteLink = `${process.env.CLIENT_URL}/invite/${token}`;
    await sendInvitationEmail(email, req.user.name, project.name, inviteLink);

    const registeredUser = await User.findOne({ email });
    if (registeredUser) {
      req.io.to(`user_${registeredUser._id}`).emit('notification', {
        title: 'Project invitation',
        message: `You have been invited to join "${project.name}". Check your email to accept.`,
        type: 'info',
        timestamp: Date.now(),
      });
    }

    res.json({ message: `Invitation sent to ${email}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token, status: 'pending' });

    if (!invitation) return res.status(404).json({ message: 'Invalid or expired invitation' });
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Check if user exists
    const user = await User.findOne({ email: invitation.email });
    if (!user) return res.status(404).json({ message: 'Please register with the invited email first' });

    const project = await Project.findById(invitation.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.find(m => m.user.toString() === user._id.toString());
    if (!isMember) {
      project.members.push({ user: user._id, role: invitation.role });
      await project.save();
    }

    invitation.status = 'accepted';
    await invitation.save();

    res.json({ message: `Joined project "${project.name}" successfully`, projectId: project._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find({ project: projectId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ActivityLog.countDocuments({ project: projectId });

    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectStats = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const Task = require('../models/Task');

    const stats = await Task.aggregate([
      { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const result = { Todo: 0, 'In Progress': 0, Review: 0, Completed: 0 };
    stats.forEach(s => { result[s._id] = s.count; });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
