const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { sendTaskAssignmentEmail, sendTaskStatusChangeEmail } = require('../services/emailService');

exports.createTask = async (req, res) => {
  try {
    const { projectId, title, description, status, priority, assignees, dueDate } = req.body;

    // Parse assignees if it comes as a stringified array from FormData
    let parsedAssignees = [];
    if (assignees) {
      try {
        parsedAssignees = JSON.parse(assignees);
      } catch (e) {
        parsedAssignees = Array.isArray(assignees) ? assignees : [assignees];
      }
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);
        attachments.push(uploadResult);
      }
    }

    const task = await Task.create({
      project: projectId,
      title,
      description,
      status,
      priority,
      assignees: parsedAssignees,
      dueDate,
      attachments,
      createdBy: req.user._id
    });

    const populatedTask = await Task.findById(task._id).populate('assignees', 'name email profilePicture');

    const project = await Project.findById(projectId).select('name');
    if (parsedAssignees.length > 0) {
      const assigneeUsers = await User.find({ _id: { $in: parsedAssignees } }).select('name email');
      const emailPromises = [];

      assigneeUsers.forEach((assignee) => {
        if (assignee._id.toString() !== req.user._id.toString()) {
          const notification = {
            title: 'Task assigned',
            message: `You were assigned to "${task.title}" in ${project?.name || 'a project'}`,
            type: 'info',
            timestamp: Date.now(),
          };
          req.io.to(`user_${assignee._id}`).emit('notification', notification);
          emailPromises.push(sendTaskAssignmentEmail(assignee.email, req.user.name, task.title, project?.name || 'project'));
        }
      });

      Promise.allSettled(emailPromises).catch(() => { });
    }

    // Emit via Socket.io
    req.io.to(projectId).emit('task_created', populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority } = req.query;

    if (!projectId) return res.status(400).json({ message: 'Project ID is required' });

    let query = { project: projectId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignees', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const updates = { ...req.body, updatedBy: req.user._id };

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const oldAssignees = task.assignees.map((id) => id.toString());
    const oldStatus = task.status;

    if (req.body.assignees) {
      try {
        updates.assignees = JSON.parse(req.body.assignees);
      } catch (e) {
        updates.assignees = Array.isArray(req.body.assignees) ? req.body.assignees : [req.body.assignees];
      }
    }

    if (req.files && req.files.length > 0) {
      const newAttachments = [];
      for (const file of req.files) {
        const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);
        newAttachments.push(uploadResult);
      }
      updates.attachments = [...task.attachments, ...newAttachments];
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id,
      updates,
      { new: true }
    ).populate('assignees', 'name email profilePicture');

    if (!updatedTask) return res.status(404).json({ message: 'Task not found' });

    const newAssignees = updatedTask.assignees.map((assignee) => assignee._id.toString());
    const project = await Project.findById(updatedTask.project).select('name');
    const allAssigneeIds = Array.from(new Set([...oldAssignees, ...newAssignees]));
    const assigneeUsers = await User.find({ _id: { $in: allAssigneeIds } }).select('name email');
    const emailPromises = [];

    const addedAssignees = newAssignees.filter((id) => !oldAssignees.includes(id));
    const statusChanged = updates.status && updates.status !== oldStatus;

    assigneeUsers.forEach((assignee) => {
      const isNew = addedAssignees.includes(assignee._id.toString());
      const isAssigned = newAssignees.includes(assignee._id.toString());

      if (isNew) {
        const notification = {
          title: 'Task assigned',
          message: `You were assigned to "${updatedTask.title}" in ${project?.name || 'a project'}`,
          type: 'info',
          timestamp: Date.now(),
        };
        req.io.to(`user_${assignee._id}`).emit('notification', notification);
        emailPromises.push(sendTaskAssignmentEmail(assignee.email, req.user.name, updatedTask.title, project?.name || 'project'));
      }

      if (statusChanged && isAssigned && assignee._id.toString() !== req.user._id.toString()) {
        const notification = {
          title: 'Task status updated',
          message: `Status of "${updatedTask.title}" changed to ${updatedTask.status}`,
          type: 'info',
          timestamp: Date.now(),
        };
        req.io.to(`user_${assignee._id}`).emit('notification', notification);
        emailPromises.push(sendTaskStatusChangeEmail(assignee.email, req.user.name, updatedTask.title, updatedTask.status, project?.name || 'project'));
      }
    });

    Promise.allSettled(emailPromises).catch(() => { });

    req.io.to(updatedTask.project.toString()).emit('task_updated', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    req.io.to(task.project.toString()).emit('task_deleted', req.params.id);

    // Log activity
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      project: task.project,
      user: req.user._id,
      action: 'task_deleted',
      details: `Deleted task: ${task.title}`,
    });

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk update status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { taskIds, status } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'taskIds array is required' });
    }
    if (!status) return res.status(400).json({ message: 'status is required' });

    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { status, updatedBy: req.user._id }
    );

    res.json({ message: `${result.modifiedCount} tasks updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete
exports.bulkDelete = async (req, res) => {
  try {
    const { taskIds } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'taskIds array is required' });
    }

    const result = await Task.deleteMany({ _id: { $in: taskIds } });

    res.json({ message: `${result.deletedCount} tasks deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

