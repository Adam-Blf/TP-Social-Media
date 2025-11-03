import express from 'express';
import { body, param } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';
import { isEventParticipant } from './events-utils.mjs';

const buildEventAlbumsRouter = (models) => {
  const { Event, Album } = models;
  const router = express.Router({ mergeParams: true });

  const loadEvent = async (eventId, res) => {
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ code: 404, message: 'Événement introuvable' });
      return null;
    }
    return event;
  };

  const ensureContributor = (event, userId, res, action) => {
    if (!isEventParticipant(event, userId)) {
      res.status(403).json({ code: 403, message: `Seuls les participants ou organisateurs peuvent ${action}.` });
      return false;
    }
    return true;
  };

  router.get('/',
    param('eventId').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const albums = await Album.find({ event: req.params.eventId })
        .populate('createdBy', 'firstName lastName email')
        .lean({ virtuals: true });
      res.json(albums);
    }));

  router.post('/',
    param('eventId').isMongoId(),
    body('title').isString().trim().isLength({ min: 3, max: 150 }),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    body('createdBy').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadEvent(req.params.eventId, res);
      if (!event) return;

      if (!ensureContributor(event, req.body.createdBy, res, 'créer un album')) return;

      const album = await Album.create({
        event: event.id,
        title: req.body.title,
        description: req.body.description,
        createdBy: req.body.createdBy
      });

      const populated = await Album.findById(album.id)
        .populate('createdBy', 'firstName lastName email')
        .lean({ virtuals: true });
      res.status(201).json(populated);
    }));

  router.post('/:albumId/photos',
    param('eventId').isMongoId(),
    param('albumId').isMongoId(),
    body('url').isURL(),
    body('caption').optional().isString().trim().isLength({ max: 200 }),
    body('uploadedBy').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadEvent(req.params.eventId, res);
      if (!event) return;

      if (!ensureContributor(event, req.body.uploadedBy, res, 'ajouter des photos')) return;

      const album = await Album.findOne({ _id: req.params.albumId, event: req.params.eventId });
      if (!album) {
        res.status(404).json({ code: 404, message: 'Album introuvable' });
        return;
      }

      album.photos.push({
        url: req.body.url,
        caption: req.body.caption,
        uploadedBy: req.body.uploadedBy
      });

      await album.save();

      const populated = await Album.findById(album.id)
        .populate('createdBy', 'firstName lastName email')
        .lean({ virtuals: true });
      res.status(201).json(populated);
    }));

  router.post('/:albumId/photos/:photoId/comments',
    param('eventId').isMongoId(),
    param('albumId').isMongoId(),
    param('photoId').isMongoId(),
    body('author').isMongoId(),
    body('body').isString().trim().isLength({ min: 1, max: 500 }),
    validateRequest,
    handleAsync(async (req, res) => {
      const event = await loadEvent(req.params.eventId, res);
      if (!event) return;

      if (!ensureContributor(event, req.body.author, res, 'commenter')) return;

      const album = await Album.findOne({ _id: req.params.albumId, event: req.params.eventId });
      if (!album) {
        res.status(404).json({ code: 404, message: 'Album introuvable' });
        return;
      }

      const photo = album.photos.id(req.params.photoId);
      if (!photo) {
        res.status(404).json({ code: 404, message: 'Photo introuvable' });
        return;
      }

      photo.comments.push({
        author: req.body.author,
        body: req.body.body
      });

      await album.save();

      const populated = await Album.findById(album.id)
        .populate('createdBy', 'firstName lastName email')
        .lean({ virtuals: true });
      res.status(201).json(populated);
    }));

  return router;
};

export default buildEventAlbumsRouter;
