import express from 'express';
import { body, param, query } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';
import {
  populateEvent,
  ensureUsersExist,
  buildEventSettings,
  mergeGroupMembersIntoParticipants,
  ensureParticipantStructure,
  ensureParticipantExists,
  appendParticipant
} from './events-utils.mjs';
import buildEventPollsRouter from './events-polls-controller.mjs';
import buildEventTicketingRouter from './events-ticketing-controller.mjs';
import buildEventAlbumsRouter from './events-albums-controller.mjs';
import buildEventShoppingRouter from './events-shopping-controller.mjs';
import buildEventCarpoolRouter from './events-carpool-controller.mjs';
import buildEventDiscussionsRouter from './events-discussions-controller.mjs';

// Fabrique le routeur principal des événements et délègue les sous-domaines vers des sous-routeurs dédiés
const buildEventsRouter = (models) => {
  const { Event, User, Group } = models;
  const router = express.Router();

  router.use('/:eventId/polls', buildEventPollsRouter(models));
  router.use('/:eventId/ticketing', buildEventTicketingRouter(models));
  router.use('/:eventId/albums', buildEventAlbumsRouter(models));
  router.use('/:eventId/shopping-list', buildEventShoppingRouter(models));
  router.use('/:eventId/carpool', buildEventCarpoolRouter(models));
  router.use('/:eventId/discussions', buildEventDiscussionsRouter(models));

  // Liste des événements filtrable par groupe, type ou période
  router.get('/',
    query('group').optional().isMongoId(),
    query('privacy').optional().isIn(['public', 'private']),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    validateRequest,
    handleAsync(async (req, res) => {
      const filters = {};
      if (req.query.group) {
        filters.group = req.query.group;
      }
      if (req.query.privacy) {
        filters.privacy = req.query.privacy;
      }
      if (req.query.from || req.query.to) {
        filters.startDate = {};
        if (req.query.from) {
          filters.startDate.$gte = new Date(req.query.from);
        }
        if (req.query.to) {
          filters.startDate.$lte = new Date(req.query.to);
        }
      }

      const events = await populateEvent(Event.find(filters).sort({ startDate: 1 }));
      res.json(events);
    }));

  // Création d’un nouvel événement en respectant les règles de groupe
  router.post('/',
    body('name').isString().trim().isLength({ min: 3, max: 150 }),
    body('description').isString().trim().isLength({ min: 10, max: 2000 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('location').isString().trim().isLength({ min: 3, max: 200 }),
    body('coverPhoto').optional().isURL(),
    body('privacy').optional().isIn(['public', 'private']),
    body('createdBy').isMongoId(),
    body('group').optional().isMongoId(),
    body('organizers').isArray({ min: 1 }),
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
      const {
        createdBy,
        organizers,
        participants,
        group: groupId,
        inviteGroupMembers = false
      } = req.body;

      const creator = await User.findById(createdBy);
      if (!creator) {
        res.status(400).json({ code: 400, message: 'Créateur introuvable.' });
        return;
      }

      if (!organizers.some((id) => id === createdBy || id.toString() === createdBy)) {
        organizers.push(createdBy);
      }

      const organizersExist = await ensureUsersExist(User, organizers);
      if (!organizersExist) {
        res.status(400).json({ code: 400, message: 'Un ou plusieurs organisateurs sont introuvables.' });
        return;
      }

      const groupDoc = groupId ? await Group.findById(groupId) : null;
      if (groupId && !groupDoc) {
        res.status(404).json({ code: 404, message: 'Groupe introuvable.' });
        return;
      }

      if (groupDoc) {
        const member = groupDoc.members.find((m) => m.user.toString() === createdBy.toString());
        if (!member) {
          res.status(403).json({ code: 403, message: 'Seuls les membres du groupe peuvent créer un événement.' });
          return;
        }
        if (!groupDoc.allowMemberEvents && member.role !== 'admin') {
          res.status(403).json({ code: 403, message: 'Ce groupe limite la création d’événements aux administrateurs.' });
          return;
        }
      }

      const participantList = ensureParticipantStructure(participants || []);
      const participantIds = participantList.map((participant) => participant.user);
      const participantsExist = await ensureUsersExist(User, participantIds);
      if (!participantsExist) {
        res.status(400).json({ code: 400, message: 'Un ou plusieurs participants sont introuvables.' });
        return;
      }

      const mergedParticipants = inviteGroupMembers
        ? mergeGroupMembersIntoParticipants(groupDoc, participantList)
        : participantList;

      const eventSettings = buildEventSettings(req.body.settings, groupDoc);

      const event = await Event.create({
        ...req.body,
        organizers,
        participants: mergedParticipants,
        settings: eventSettings
      });

      const populated = await populateEvent(Event.findById(event.id));
      res.status(201).json(populated);
    }));

  // Lecture détaillée d’un événement
  router.get('/:id',
    param('id').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await populateEvent(Event.findById(req.params.id));
      if (!event) {
        res.status(404).json({ code: 404, message: 'Événement introuvable' });
        return;
      }
      res.json(event);
    }));

  // Mise à jour souple d’un événement
  router.patch('/:id',
    param('id').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 3, max: 150 }),
    body('description').optional().isString().trim().isLength({ min: 10, max: 2000 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('location').optional().isString().trim().isLength({ min: 3, max: 200 }),
    body('coverPhoto').optional().isURL(),
    body('privacy').optional().isIn(['public', 'private']),
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
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await Event.findById(req.params.id);
      if (!event) {
        res.status(404).json({ code: 404, message: 'Événement introuvable' });
        return;
      }

      if (req.body.organizers) {
        const organizersExist = await ensureUsersExist(User, req.body.organizers);
        if (!organizersExist) {
          res.status(400).json({ code: 400, message: 'Un ou plusieurs organisateurs sont introuvables.' });
          return;
        }
        if (!req.body.organizers.some((id) => id.toString() === event.createdBy.toString())) {
          res.status(400).json({ code: 400, message: 'Le créateur doit rester organisateur.' });
          return;
        }
        event.organizers = req.body.organizers;
      }

      if (req.body.participants) {
        const participants = ensureParticipantStructure(req.body.participants);
        const participantsExist = await ensureUsersExist(User, participants.map((p) => p.user));
        if (!participantsExist) {
          res.status(400).json({ code: 400, message: 'Un ou plusieurs participants sont introuvables.' });
          return;
        }
        event.participants = participants;
      }

      ['name', 'description', 'startDate', 'endDate', 'location', 'coverPhoto', 'privacy'].forEach((field) => {
        if (typeof req.body[field] !== 'undefined') {
          event[field] = req.body[field];
        }
      });

      if (req.body.settings) {
        const groupDoc = event.group ? await Group.findById(event.group) : null;
        event.settings = buildEventSettings(req.body.settings, groupDoc);
      }

      await event.save();
      const populated = await populateEvent(Event.findById(event.id));
      res.json(populated);
    }));

  // Ajoute un participant en s’assurant de son unicité
  router.post('/:id/participants',
    param('id').isMongoId(),
    body('user').isMongoId(),
    body('status').optional().isIn(['going', 'interested']),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await Event.findById(req.params.id);
      if (!event) {
        res.status(404).json({ code: 404, message: 'Événement introuvable' });
        return;
      }

      const userExists = await User.exists({ _id: req.body.user });
      if (!userExists) {
        res.status(400).json({ code: 400, message: 'Utilisateur introuvable.' });
        return;
      }

      const added = appendParticipant(event, req.body.user, req.body.status || 'going');
      if (!added) {
        res.status(409).json({ code: 409, message: 'Participant déjà présent.' });
        return;
      }

      await event.save();
      const populated = await populateEvent(Event.findById(event.id));
      res.status(201).json(populated);
    }));

  // Modifie le statut d’un participant existant
  router.patch('/:eventId/participants/:participantId',
    param('eventId').isMongoId(),
    param('participantId').isMongoId(),
    body('status').isIn(['going', 'interested']),
    validateRequest,
    handleAsync(async (req, res) => {
      const { event, participant } = await ensureParticipantExists(Event, req.params.eventId, req.params.participantId);
      if (!event) {
        res.status(404).json({ code: 404, message: 'Événement introuvable' });
        return;
      }
      if (!participant) {
        res.status(404).json({ code: 404, message: 'Participant introuvable' });
        return;
      }

      participant.status = req.body.status;
      await event.save();
      const populated = await populateEvent(Event.findById(event.id));
      res.json(populated);
    }));

  // Supprime un participant et renvoie la ressource mise à jour
  router.delete('/:eventId/participants/:participantId',
    param('eventId').isMongoId(),
    param('participantId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const { event, participant } = await ensureParticipantExists(Event, req.params.eventId, req.params.participantId);
      if (!event) {
        res.status(404).json({ code: 404, message: 'Événement introuvable' });
        return;
      }
      if (!participant) {
        res.status(404).json({ code: 404, message: 'Participant introuvable' });
        return;
      }

      participant.deleteOne();
      await event.save();
      const populated = await populateEvent(Event.findById(event.id));
      res.json(populated);
    }));

  return router;
};

export default buildEventsRouter;
