const Task = require('../models/Task');
const { uploadToCloudinary } = require('../services/cloudinaryService');

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

    if (req.body.assignees) {
      try {
        updates.assignees = JSON.parse(req.body.assignees);
      } catch (e) {
        updates.assignees = Array.isArray(req.body.assignees) ? req.body.assignees : [req.body.assignees];
      }
    }

    if (req.files && req.files.length > 0) {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: 'Task not found' });

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

