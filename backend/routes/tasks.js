const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const checkMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const member = project.members.find(m => m.user.toString() === userId.toString());
  if (!member) return { error: 'Not a member of this project', status: 403 };
  return { project, member };
};

router.get('/', async (req, res) => {
  try {
    const { project, status, assignee, priority, overdue } = req.query;
    if (!project) return res.status(400).json({ success: false, message: 'project param required' });
    const { error, status: errStatus } = await checkMember(project, req.user._id);
    if (error) return res.status(errStatus).json({ success: false, message: error });

    const filter = { project };
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (priority) filter.priority = priority;
    if (overdue === 'true') { filter.dueDate = { $lt: new Date() }; filter.status = { $ne: 'done' }; }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/my', async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name color')
      .populate('assignee', 'name email avatar')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/dashboard', async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id }).select('_id name color');
    const projectIds = projects.map(p => p._id);

    const [myTasks, overdueTasks, doneTasks, totalTasks, recentTasks] = await Promise.all([
      Task.countDocuments({ assignee: req.user._id, status: { $ne: 'done' } }),
      Task.countDocuments({ project: { $in: projectIds }, dueDate: { $lt: new Date() }, status: { $ne: 'done' } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.find({ project: { $in: projectIds } })
        .populate('assignee', 'name avatar')
        .populate('project', 'name color')
        .sort({ updatedAt: -1 }).limit(10)
    ]);

    const statusBreakdown = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const priorityBreakdown = await Task.aggregate([
      { $match: { project: { $in: projectIds }, status: { $ne: 'done' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        stats: { myTasks, overdueTasks, doneTasks, totalTasks, projects: projects.length },
        statusBreakdown, priorityBreakdown, recentActivity: recentTasks
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/',
  [body('title').trim().notEmpty(), body('project').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const { error, status } = await checkMember(req.body.project, req.user._id);
      if (error) return res.status(status).json({ success: false, message: error });
      const task = await Task.create({
        ...req.body,
        createdBy: req.user._id,
        activity: [{ actor: req.user._id, action: 'created this task' }]
      });
      await task.populate('assignee', 'name email avatar');
      await task.populate('createdBy', 'name email avatar');
      res.status(201).json({ success: true, data: task });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .populate('activity.actor', 'name avatar')
      .populate('project', 'name color');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const { error, status } = await checkMember(task.project._id, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });
    res.json({ success: true, data: task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const { error, status } = await checkMember(task.project, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const allowed = ['title', 'description', 'assignee', 'status', 'priority', 'dueDate', 'tags', 'order'];
    const activityEntries = [];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'status' && req.body.status !== task.status)
          activityEntries.push({ actor: req.user._id, action: 'changed status', field: 'status', oldValue: task.status, newValue: req.body.status });
        else if (field === 'priority' && req.body.priority !== task.priority)
          activityEntries.push({ actor: req.user._id, action: 'changed priority', field: 'priority', oldValue: task.priority, newValue: req.body.priority });
        task[field] = req.body[field];
      }
    });

    task.activity.push(...activityEntries);
    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('activity.actor', 'name avatar');
    res.json({ success: true, data: task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const { error, status, member } = await checkMember(task.project, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });
    if (task.createdBy.toString() !== req.user._id.toString() && member.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const { error, status } = await checkMember(task.project, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });
    task.comments.push({ author: req.user._id, text });
    task.activity.push({ actor: req.user._id, action: 'added a comment' });
    await task.save();
    await task.populate('comments.author', 'name email avatar');
    res.status(201).json({ success: true, data: task.comments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;