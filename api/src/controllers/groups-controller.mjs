import express from 'express';
import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';
import {
  buildEventSettings,
  mergeGroupMembersIntoParticipants,
  ensureParticipantStructure,
  populateEvent
} from './events-utils.mjs';

const ensureUsersExist = async (User, userIds) => {
  const uniqueIds = [...new Set(userIds.map((id) => id.toString()))];
  const count = await User.countDocuments({ _id: { $in: uniqueIds } });
  return count === uniqueIds.length;
};

const populateGroup = (query) => query
  .populate({
    path: 'members.user',
    select: 'firstName lastName email avatarUrl'
  })
  .lean({ virtuals: true });

const buildGroupsRouter = ({
  Group,
  User,
  DiscussionThread,
  Event
}) => {
  const router = express.Router();

  router.get('/', handleAsync(async (req, res) => {
    const groups = await populateGroup(Group.find());
    res.json(groups);
  }));

  router.post('/',
    body('name').isString().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('icon').optional().isURL(),
    body('coverPhoto').optional().isURL(),
    body('type').optional().isIn(['public', 'private', 'secret']),
    body('allowMemberPosts').optional().isBoolean(),
    body('allowMemberEvents').optional().isBoolean(),
    body('allowExternalSharing').optional().isBoolean(),
    body('members').isArray({ min: 1 }),
    body('members.*.user').isMongoId(),
    body('members.*.role').optional().isIn(['member', 'admin']),
    validateRequest,
    handleAsync(async (req, res) => {
      const { members } = req.body;
      const hasAdmin = members.some((member) => member.role === 'admin');

      if (!hasAdmin) {
        res.status(400).json({ code: 400, message: 'A group must include at least one administrator.' });
        return;
      }

      const userIds = members.map((member) => member.user);
      const usersExist = await ensureUsersExist(User, userIds);

      if (!usersExist) {
        res.status(400).json({ code: 400, message: 'One or more referenced users were not found.' });
        return;
      }

      const group = await Group.create(req.body);
      const populated = await populateGroup(Group.findById(group.id));
      res.status(201).json(populated);
    }));

  router.get('/:id',
    param('id').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const group = await populateGroup(Group.findById(req.params.id));
      if (!group) {
        res.status(404).json({ code: 404, message: 'Group not found' });
        return;
      }
      res.json(group);
    }));

  router.patch('/:id',
    param('id').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('icon').optional().isURL(),
    body('coverPhoto').optional().isURL(),
    body('type').optional().isIn(['public', 'private', 'secret']),
    body('allowMemberPosts').optional().isBoolean(),
    body('allowMemberEvents').optional().isBoolean(),
    body('allowExternalSharing').optional().isBoolean(),
    validateRequest,
    handleAsync(async (req, res) => {
      const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      if (!group) {
        res.status(404).json({ code: 404, message: 'Group not found' });
        return;
      }

      const populated = await populateGroup(Group.findById(group.id));
      res.json(populated);
    }));

  router.post('/:id/members',
    param('id').isMongoId(),
    body('user').isMongoId(),
    body('role').optional().isIn(['member', 'admin']),
    validateRequest,
    handleAsync(async (req, res) => {
      const { id } = req.params;
      const group = await Group.findById(id);

      if (!group) {
        res.status(404).json({ code: 404, message: 'Group not found' });
        return;
      }

      const userExists = await User.exists({ _id: req.body.user });
      if (!userExists) {
        res.status(400).json({ code: 400, message: 'Referenced user not found' });
        return;
      }

      const alreadyMember = group.members.some((member) => member.user.toString() === req.body.user);
      if (alreadyMember) {
        res.status(409).json({ code: 409, message: 'User already in group' });
        return;
      }

      group.members.push({ user: new mongoose.Types.ObjectId(req.body.user), role: req.body.role || 'member' });
      await group.save();

      const populated = await populateGroup(Group.findById(id));
      res.status(201).json(populated);
    }));

  router.patch('/:groupId/members/:memberId',
    param('groupId').isMongoId(),
    param('memberId').isMongoId(),
    body('role').isIn(['member', 'admin']),
    validateRequest,
    handleAsync(async (req, res) => {
      const group = await Group.findById(req.params.groupId);

      if (!group) {
        res.status(404).json({ code: 404, message: 'Group not found' });
        return;
      }

      const member = group.members.id(req.params.memberId);
      if (!member) {
        res.status(404).json({ code: 404, message: 'Member not found' });
        return;
      }

      member.role = req.body.role;

      const adminCount = group.members.filter((m) => m.role === 'admin').length;
      if (adminCount === 0) {
        res.status(400).json({ code: 400, message: 'At least one admin is required.' });
        return;
      }

      await group.save();
      const populated = await populateGroup(Group.findById(req.params.groupId));
      res.json(populated);
    }));

  router.delete('/:groupId/members/:memberId',
    param('groupId').isMongoId(),
    param('memberId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const group = await Group.findById(req.params.groupId);

      if (!group) {
        res.status(404).json({ code: 404, message: 'Group not found' });
        return;
      }

      const member = group.members.id(req.params.memberId);

      if (!member) {
        res.status(404).json({ code: 404, message: 'Member not found' });
        return;
      }

      member.remove();

      const adminCount = group.members.filter((m) => m.role === 'admin').length;
      if (adminCount === 0) {
        res.status(400).json({ code: 400, message: 'A group must retain at least one administrator.' });
        return;
      }

      if (group.members.length === 0) {
        res.status(400).json({ code: 400, message: 'A group must have at least one member.' });
        return;
      }

      await group.save();
      const populated = await populateGroup(Group.findById(req.params.groupId));
      res.json(populated);
    }));

  router.post('/:groupId/events',
    param('groupId').isMongoId(),
    body('name').isString().trim().isLength({ min: 3, max: 150 }),
    body('description').isString().trim().isLength({ min: 10, max: 2000 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('location').isString().trim().isLength({ min: 3, max: 200 }),
    body('coverPhoto').optional().isURL(),
    body('privacy').optional().isIn(['public', 'private']),
    body('createdBy').isMongoId(),
    body('organizers').optional().isArray({ min: 1 }),
    body('organizers.*').isMongoId(),
    body('participants').optional().isArray(),
    body('participants.*.user').isMongoId(),
    body('participants.*.status').optional().isIn(['going', 'interested']),
    body('settings').optional().isObject(),
    body('settings.allowSharing').optional().isBoolean(),
    body('settings.shoppingListEnabled').optional().isBoolean(),
    body('settings.carpoolingEnabled').optional().isBoolean(),
    body('settings.ticketingEnabled').optional().isBoolean(),
    body('inviteGroupMembers').optional().isBoolean(),
    validateRequest,
    handleAsync(async (req, res) => {
      const group = await Group.findById(req.params.groupId);
      if (!group) {
        res.status(404).json({ code: 404, message: 'Group not found' });
        return;
      }

      const member = group.members.find((m) => m.user.toString() === req.body.createdBy);
      if (!member) {
        res.status(403).json({ code: 403, message: 'Only group members can create events.' });
        return;
      }

      if (!group.allowMemberEvents && member.role !== 'admin') {
        res.status(403).json({ code: 403, message: 'This group only allows admins to create events.' });
        return;
      }

      const organizers = (req.body.organizers && req.body.organizers.length)
        ? [...req.body.organizers]
        : [req.body.createdBy];

      if (!organizers.some((id) => id === req.body.createdBy || id.toString() === req.body.createdBy)) {
        organizers.push(req.body.createdBy);
      }

      const organizersExist = await ensureUsersExist(User, organizers);
      if (!organizersExist) {
        res.status(400).json({ code: 400, message: 'One or more organizers were not found.' });
        return;
      }

      const participantList = ensureParticipantStructure(req.body.participants || []);
      const participantsExist = await ensureUsersExist(User, participantList.map((participant) => participant.user));
      if (!participantsExist) {
        res.status(400).json({ code: 400, message: 'One or more participants were not found.' });
        return;
      }

      const inviteGroupMembers = req.body.inviteGroupMembers ?? true;
      const mergedParticipants = inviteGroupMembers
        ? mergeGroupMembersIntoParticipants(group, participantList)
        : participantList;

      const eventSettings = buildEventSettings(req.body.settings, group);

      const eventPayload = {
        name: req.body.name,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        location: req.body.location,
        coverPhoto: req.body.coverPhoto,
        privacy: req.body.privacy,
        createdBy: req.body.createdBy,
        group: req.params.groupId,
        organizers,
        participants: mergedParticipants,
        settings: eventSettings
      };

      const event = await Event.create(eventPayload);

      const populated = await populateEvent(Event.findById(event.id));
      res.status(201).json(populated);
    }));

  router.get('/:groupId/discussions',
    param('groupId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const threads = await DiscussionThread.find({ group: req.params.groupId })
        .populate('createdBy', 'firstName lastName')
        .lean({ virtuals: true });

      res.json(threads);
    }));

  router.post('/:groupId/discussions',
    param('groupId').isMongoId(),
    body('title').isString().trim().isLength({ min: 3, max: 150 }),
    body('createdBy').isMongoId(),
    body('message').isString().trim().isLength({ min: 1, max: 1000 }),
    validateRequest,
    handleAsync(async (req, res) => {
      const group = await Group.findById(req.params.groupId);
      if (!group) {
        res.status(404).json({ code: 404, message: 'Group not found' });
        return;
      }

      const isMember = group.members.some((member) => member.user.toString() === req.body.createdBy);
      if (!isMember) {
        res.status(403).json({ code: 403, message: 'Only group members can create discussions.' });
        return;
      }

      if (!group.allowMemberPosts) {
        const member = group.members.find((m) => m.user.toString() === req.body.createdBy);
        if (member.role !== 'admin') {
          res.status(403).json({ code: 403, message: 'Member posts are disabled for this group.' });
          return;
        }
      }

      const thread = await DiscussionThread.create({
        title: req.body.title,
        group: req.params.groupId,
        createdBy: req.body.createdBy,
        messages: [
          {
            author: req.body.createdBy,
            content: req.body.message
          }
        ]
      });

      const populated = await DiscussionThread.findById(thread.id)
        .populate('createdBy', 'firstName lastName')
        .lean({ virtuals: true });

      res.status(201).json(populated);
    }));

  router.post('/:groupId/discussions/:threadId/messages',
    param('groupId').isMongoId(),
    param('threadId').isMongoId(),
    body('author').isMongoId(),
    body('content').isString().trim().isLength({ min: 1, max: 1000 }),
    body('replyTo').optional().isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const group = await Group.findById(req.params.groupId);
      if (!group) {
        res.status(404).json({ code: 404, message: 'Group not found' });
        return;
      }

      const isMember = group.members.some((member) => member.user.toString() === req.body.author);
      if (!isMember) {
        res.status(403).json({ code: 403, message: 'Only group members can post messages.' });
        return;
      }

      if (!group.allowMemberPosts) {
        const member = group.members.find((m) => m.user.toString() === req.body.author);
        if (member.role !== 'admin') {
          res.status(403).json({ code: 403, message: 'Member posts are disabled for this group.' });
          return;
        }
      }

      const thread = await DiscussionThread.findOne({ _id: req.params.threadId, group: req.params.groupId });
      if (!thread) {
        res.status(404).json({ code: 404, message: 'Discussion thread not found' });
        return;
      }

      if (req.body.replyTo) {
        const message = thread.messages.id(req.body.replyTo);
        if (!message) {
          res.status(404).json({ code: 404, message: 'Message to reply to not found' });
          return;
        }

        message.replies.push({
          author: req.body.author,
          content: req.body.content
        });
      } else {
        thread.messages.push({
          author: req.body.author,
          content: req.body.content
        });
      }

      await thread.save();

      const populated = await DiscussionThread.findById(thread.id)
        .populate('createdBy', 'firstName lastName')
        .lean({ virtuals: true });

      res.status(201).json(populated);
    }));

  return router;
};

export default buildGroupsRouter;
