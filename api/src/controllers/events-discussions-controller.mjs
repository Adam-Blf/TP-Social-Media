import express from 'express';
import { body, param } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';
import { isEventParticipant } from './events-utils.mjs';

const buildEventDiscussionsRouter = (models) => {
  const { Event, DiscussionThread } = models;
  const router = express.Router({ mergeParams: true });

  const loadEvent = async (eventId, res) => {
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ code: 404, message: 'Événement introuvable' });
      return null;
    }
    return event;
  };

  router.get('/',
    param('eventId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const threads = await DiscussionThread.find({ event: req.params.eventId })
        .populate('createdBy', 'firstName lastName')
        .lean({ virtuals: true });
      res.json(threads);
    }));

  router.post('/',
    param('eventId').isMongoId(),
    body('title').isString().trim().isLength({ min: 3, max: 150 }),
    body('createdBy').isMongoId(),
    body('message').isString().trim().isLength({ min: 1, max: 1000 }),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadEvent(req.params.eventId, res);
      if (!event) return;

      if (!isEventParticipant(event, req.body.createdBy)) {
        res.status(403).json({ code: 403, message: 'Seuls les participants peuvent ouvrir une discussion.' });
        return;
      }

      const thread = await DiscussionThread.create({
        title: req.body.title,
        event: req.params.eventId,
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

  router.post('/:threadId/messages',
    param('eventId').isMongoId(),
    param('threadId').isMongoId(),
    body('author').isMongoId(),
    body('content').isString().trim().isLength({ min: 1, max: 1000 }),
    body('replyTo').optional().isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadEvent(req.params.eventId, res);
      if (!event) return;

      if (!isEventParticipant(event, req.body.author)) {
        res.status(403).json({ code: 403, message: 'Seuls les participants peuvent intervenir.' });
        return;
      }

      const thread = await DiscussionThread.findOne({ _id: req.params.threadId, event: req.params.eventId });
      if (!thread) {
        res.status(404).json({ code: 404, message: 'Fil de discussion introuvable' });
        return;
      }

      if (req.body.replyTo) {
        const message = thread.messages.id(req.body.replyTo);
        if (!message) {
          res.status(404).json({ code: 404, message: 'Message cible introuvable' });
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

export default buildEventDiscussionsRouter;
