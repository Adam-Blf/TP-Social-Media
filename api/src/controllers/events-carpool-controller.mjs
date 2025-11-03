import express from 'express';
import { body, param } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';
import { isEventParticipant } from './events-utils.mjs';

const buildEventCarpoolRouter = (models) => {
  const { Event, CarpoolOffer } = models;
  const router = express.Router({ mergeParams: true });

  const loadCarpoolEvent = async (eventId, res) => {
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ code: 404, message: 'Événement introuvable' });
      return null;
    }
    if (!event.settings.carpoolingEnabled) {
      res.status(400).json({ code: 400, message: 'Le covoiturage est désactivé pour cet événement.' });
      return null;
    }
    return event;
  };

  router.get('/',
    param('eventId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const offers = await CarpoolOffer.find({ event: req.params.eventId })
        .populate('driver', 'firstName lastName email')
        .lean({ virtuals: true });
      res.json(offers);
    }));

  router.post('/',
    param('eventId').isMongoId(),
    body('driver').isMongoId(),
    body('departureLocation').isString().trim().isLength({ min: 3, max: 200 }),
    body('departureTime').isISO8601(),
    body('price').isFloat({ min: 0 }),
    body('availableSeats').isInt({ min: 1 }),
    body('maxDeviationMinutes').isInt({ min: 0 }),
    body('notes').optional().isString().trim().isLength({ max: 200 }),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadCarpoolEvent(req.params.eventId, res);
      if (!event) return;

      if (!isEventParticipant(event, req.body.driver)) {
        res.status(403).json({ code: 403, message: 'Seuls les participants peuvent proposer un trajet.' });
        return;
      }

      const offer = await CarpoolOffer.create({
        event: event.id,
        driver: req.body.driver,
        departureLocation: req.body.departureLocation,
        departureTime: req.body.departureTime,
        price: req.body.price,
        availableSeats: req.body.availableSeats,
        maxDeviationMinutes: req.body.maxDeviationMinutes,
        notes: req.body.notes
      });

      const populated = await CarpoolOffer.findById(offer.id)
        .populate('driver', 'firstName lastName email')
        .lean({ virtuals: true });
      res.status(201).json(populated);
    }));

  router.delete('/:offerId',
    param('eventId').isMongoId(),
    param('offerId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadCarpoolEvent(req.params.eventId, res);
      if (!event) return;

      const offer = await CarpoolOffer.findOneAndDelete({ _id: req.params.offerId, event: req.params.eventId });
      if (!offer) {
        res.status(404).json({ code: 404, message: 'Offre introuvable' });
        return;
      }

      res.json(offer.toJSON());
    }));

  return router;
};

export default buildEventCarpoolRouter;
