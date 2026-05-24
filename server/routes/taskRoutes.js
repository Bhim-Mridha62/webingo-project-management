const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTask, deleteTask, bulkUpdateStatus, bulkDelete } = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(protect);

router.route('/')
  .post(upload.array('attachments', 5), createTask)
  .get(getTasks);

router.route('/:id')
  .put(upload.array('attachments', 5), updateTask)
  .delete(deleteTask);

// Bulk operations
router.put('/bulk/status', bulkUpdateStatus);
router.post('/bulk/delete', bulkDelete);

module.exports = router;
