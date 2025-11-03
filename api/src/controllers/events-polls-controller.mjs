import express from 'express';
import { body, param } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';
import { isEventOrganizer, isEventParticipant } from './events-utils.mjs';

const buildEventPollsRouter = (models) => {
  const { Event, Poll, PollResponse } = models;
  const router = express.Router({ mergeParams: true });

  // Récupère l’événement courant ou renvoie 404
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
      const polls = await Poll.find({ event: req.params.eventId })
        .populate('createdBy', 'firstName lastName email')
        .lean({ virtuals: true });
      res.json(polls);
    }));

  router.post('/',
    param('eventId').isMongoId(),
    body('title').isString().trim().isLength({ min: 3, max: 150 }),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    body('createdBy').isMongoId(),
    body('questions').isArray({ min: 1 }),
    body('questions.*.text').isString().trim().isLength({ min: 1, max: 500 }),
    body('questions.*.options').isArray({ min: 2 }),
    body('questions.*.options.*.label').isString().trim().isLength({ min: 1, max: 200 }),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadEvent(req.params.eventId, res);
      if (!event) return;

      if (!isEventOrganizer(event, req.body.createdBy)) {
        res.status(403).json({ code: 403, message: 'Seuls les organisateurs peuvent créer un sondage.' });
        return;
      }

      const poll = await Poll.create({
        event: event.id,
        title: req.body.title,
        description: req.body.description,
        createdBy: req.body.createdBy,
        questions: req.body.questions
      });

      const populated = await Poll.findById(poll.id)
        .populate('createdBy', 'firstName lastName email')
        .lean({ virtuals: true });

      res.status(201).json(populated);
    }));

  router.post('/:pollId/responses',
    param('eventId').isMongoId(),
    param('pollId').isMongoId(),
    body('respondent').isMongoId(),
    body('answers').isArray({ min: 1 }),
    body('answers.*.questionId').isMongoId(),
    body('answers.*.optionId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadEvent(req.params.eventId, res);
      if (!event) return;

      if (!isEventParticipant(event, req.body.respondent)) {
        res.status(403).json({ code: 403, message: 'Seuls les participants peuvent répondre au sondage.' });
        return;
      }

      const poll = await Poll.findOne({ _id: req.params.pollId, event: req.params.eventId });
      if (!poll) {
        res.status(404).json({ code: 404, message: 'Sondage introuvable' });
        return;
      }

      const response = await PollResponse.create({
        poll: poll.id,
        event: event.id,
        respondent: req.body.respondent,
        answers: req.body.answers
      });

      res.status(201).json(response.toJSON());
    }));

  return router;
};

export default buildEventPollsRouter;
