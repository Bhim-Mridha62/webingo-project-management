const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  sendInvitation,
  acceptInvitation,
  getActivityLog,
  getProjectStats,
} = require('../controllers/projectController');
const { protect, authorizeProjectRole } = require('../middlewares/authMiddleware');

router.use(protect);

// Accept invitation (needs only auth, not membership)
router.get('/invite/:token', acceptInvitation);

router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById)
  .put(authorizeProjectRole('Admin'), updateProject)
  .delete(authorizeProjectRole('Admin'), deleteProject);

// Members management (Admin only)
router.post('/:projectId/members', authorizeProjectRole('Admin'), addMember);
router.delete('/:projectId/members/:memberId', authorizeProjectRole('Admin'), removeMember);

// Invitation
router.post('/:projectId/invite', authorizeProjectRole('Admin'), sendInvitation);

// Activity log (all members)
router.get('/:id/activity', getActivityLog);

// Stats
router.get('/:id/stats', getProjectStats);

module.exports = router;
