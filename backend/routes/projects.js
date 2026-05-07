const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    const projectsWithStats = await Promise.all(projects.map(async p => {
      const [total, done, overdue] = await Promise.all([
        Task.countDocuments({ project: p._id }),
        Task.countDocuments({ project: p._id, status: 'done' }),
        Task.countDocuments({ project: p._id, dueDate: { $lt: new Date() }, status: { $ne: 'done' } })
      ]);
      return { ...p.toObject(), stats: { total, done, overdue } };
    }));

    res.json({ success: true, data: projectsWithStats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/',
  [body('name').trim().notEmpty(), body('description').optional().isLength({ max: 500 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const project = await Project.create({ ...req.body, owner: req.user._id });
      await project.populate('owner', 'name email avatar');
      await project.populate('members.user', 'name email avatar');
      res.status(201).json({ success: true, data: project });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  }
);

router.get('/:projectId', requireProjectMember, async (req, res) => {
  try {
    await req.project.populate('owner', 'name email avatar');
    await req.project.populate('members.user', 'name email avatar');
    const [total, done, inProgress, overdue] = await Promise.all([
      Task.countDocuments({ project: req.project._id }),
      Task.countDocuments({ project: req.project._id, status: 'done' }),
      Task.countDocuments({ project: req.project._id, status: 'in_progress' }),
      Task.countDocuments({ project: req.project._id, dueDate: { $lt: new Date() }, status: { $ne: 'done' } })
    ]);
    res.json({ success: true, data: { ...req.project.toObject(), stats: { total, done, inProgress, overdue } } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:projectId', requireProjectAdmin, async (req, res) => {
  try {
    const allowed = ['name', 'description', 'color', 'status', 'dueDate'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const project = await Project.findByIdAndUpdate(req.params.projectId, updates, { new: true, runValidators: true })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    res.json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:projectId', requireProjectAdmin, async (req, res) => {
  try {
    await Task.deleteMany({ project: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:projectId/members', requireProjectAdmin, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.project.members.some(m => m.user.toString() === userToAdd._id.toString()))
      return res.status(409).json({ success: false, message: 'User is already a member' });
    req.project.members.push({ user: userToAdd._id, role });
    await req.project.save();
    await req.project.populate('members.user', 'name email avatar');
    res.json({ success: true, data: req.project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:projectId/members/:userId', requireProjectAdmin, async (req, res) => {
  try {
    if (req.params.userId === req.project.owner.toString())
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
    req.project.members = req.project.members.filter(m => m.user.toString() !== req.params.userId);
    await req.project.save();
    res.json({ success: true, data: req.project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:projectId/members/:userId', requireProjectAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });
    const member = req.project.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    member.role = role;
    await req.project.save();
    res.json({ success: true, data: req.project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;