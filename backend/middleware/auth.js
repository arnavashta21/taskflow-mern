const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer '))
      token = req.headers.authorization.split(' ')[1];
    if (!token)
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.requireProjectAdmin = async (req, res, next) => {
  const Project = require('../models/Project');
  const projectId = req.params.projectId || req.body.project;
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const member = project.members.find(m => m.user.toString() === req.user._id.toString());
  if (!member || member.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required' });
  req.project = project;
  next();
};

exports.requireProjectMember = async (req, res, next) => {
  const Project = require('../models/Project');
  const projectId = req.params.projectId || req.params.id || req.body.project;
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
  if (!isMember)
    return res.status(403).json({ success: false, message: 'Not a member of this project' });
  req.project = project;
  next();
};