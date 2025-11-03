import express from 'express';
import { body, param } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';
import { isEventOrganizer } from './events-utils.mjs';

const buildEventTicketingRouter = (models) => {
  const { Event, TicketType, Ticket } = models;
  const router = express.Router({ mergeParams: true });

  // Charge l’événement et vérifie l’activation de la billetterie
  const loadTicketableEvent = async (eventId, res) => {
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ code: 404, message: 'Événement introuvable' });
      return null;
    }
    if (!event.settings.ticketingEnabled) {
      res.status(400).json({ code: 400, message: 'La billetterie est désactivée pour cet événement.' });
      return null;
    }
    return event;
  };

  router.get('/types',
    param('eventId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const types = await TicketType.find({ event: req.params.eventId })
        .populate('createdBy', 'firstName lastName email')
        .lean({ virtuals: true });
      res.json(types);
    }));

  router.post('/types',
    param('eventId').isMongoId(),
    body('name').isString().trim().isLength({ min: 3, max: 100 }),
    body('price').isFloat({ min: 0 }),
    body('currency').optional().isString().trim().isLength({ min: 3, max: 3 }),
    body('quantity').isInt({ min: 1 }),
    body('createdBy').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadTicketableEvent(req.params.eventId, res);
      if (!event) return;

      if (!isEventOrganizer(event, req.body.createdBy)) {
        res.status(403).json({ code: 403, message: 'Seuls les organisateurs peuvent créer un type de billet.' });
        return;
      }

      const ticketType = await TicketType.create({
        event: event.id,
        name: req.body.name,
        price: req.body.price,
        currency: req.body.currency || 'EUR',
        quantity: req.body.quantity,
        createdBy: req.body.createdBy
      });

      const populated = await TicketType.findById(ticketType.id)
        .populate('createdBy', 'firstName lastName email')
        .lean({ virtuals: true });

      res.status(201).json(populated);
    }));

  router.post('/tickets',
    param('eventId').isMongoId(),
    body('ticketType').isMongoId(),
    body('attendee.firstName').isString().trim().isLength({ min: 1, max: 50 }),
    body('attendee.lastName').isString().trim().isLength({ min: 1, max: 50 }),
    body('attendee.email').isEmail().normalizeEmail(),
    body('attendee.address.street').optional().isString().trim().isLength({ max: 150 }),
    body('attendee.address.postalCode').optional().isString().trim().isLength({ max: 20 }),
    body('attendee.address.city').optional().isString().trim().isLength({ max: 100 }),
    body('attendee.address.country').optional().isString().trim().isLength({ max: 100 }),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadTicketableEvent(req.params.eventId, res);
      if (!event) return;

      const ticketType = await TicketType.findOneAndUpdate(
        {
          _id: req.body.ticketType,
          event: req.params.eventId,
          $expr: { $lt: ['$sold', '$quantity'] }
        },
        { $inc: { sold: 1 } },
        { new: true }
      );

      if (!ticketType) {
        res.status(400).json({ code: 400, message: 'Type de billet indisponible ou épuisé.' });
        return;
      }

      try {
        const ticket = await Ticket.create({
          event: event.id,
          ticketType: ticketType.id,
          attendee: req.body.attendee
        });
        res.status(201).json(ticket.toJSON());
      } catch (error) {
        if (error.code === 11000) {
          res.status(409).json({ code: 409, message: 'Cette adresse email possède déjà un billet pour cet événement.' });
          return;
        }
        throw error;
      }
    }));

  return router;
};

export default buildEventTicketingRouter;
