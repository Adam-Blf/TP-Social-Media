import express from 'express';
import { body, param } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';
import { isEventParticipant } from './events-utils.mjs';

const buildEventShoppingRouter = (models) => {
  const { Event, ShoppingItem } = models;
  const router = express.Router({ mergeParams: true });

  const loadShoppingEvent = async (eventId, res) => {
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ code: 404, message: 'Événement introuvable' });
      return null;
    }
    if (!event.settings.shoppingListEnabled) {
      res.status(400).json({ code: 400, message: 'La shopping list est désactivée pour cet événement.' });
      return null;
    }
    return event;
  };

  router.get('/',
    param('eventId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const items = await ShoppingItem.find({ event: req.params.eventId })
        .populate('contributor', 'firstName lastName email')
        .lean({ virtuals: true });
      res.json(items);
    }));

  router.post('/',
    param('eventId').isMongoId(),
    body('contributor').isMongoId(),
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('quantity').isString().trim().isLength({ min: 1, max: 50 }),
    body('arrivalTime').optional().isString().trim(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadShoppingEvent(req.params.eventId, res);
      if (!event) return;

      if (!isEventParticipant(event, req.body.contributor)) {
        res.status(403).json({ code: 403, message: 'Seuls les participants peuvent proposer des éléments.' });
        return;
      }

      try {
        const item = await ShoppingItem.create({
          event: event.id,
          contributor: req.body.contributor,
          name: req.body.name,
          quantity: req.body.quantity,
          arrivalTime: req.body.arrivalTime
        });

        const populated = await ShoppingItem.findById(item.id)
          .populate('contributor', 'firstName lastName email')
          .lean({ virtuals: true });
        res.status(201).json(populated);
      } catch (error) {
        if (error.code === 11000) {
          res.status(409).json({ code: 409, message: 'Cet élément est déjà réservé pour l’événement.' });
          return;
        }
        throw error;
      }
    }));

  router.delete('/:itemId',
    param('eventId').isMongoId(),
    param('itemId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadShoppingEvent(req.params.eventId, res);
      if (!event) return;

      const item = await ShoppingItem.findOneAndDelete({ _id: req.params.itemId, event: req.params.eventId });
      if (!item) {
        res.status(404).json({ code: 404, message: 'Élément introuvable' });
        return;
      }

      res.json(item.toJSON());
    }));

  return router;
};

export default buildEventShoppingRouter;
