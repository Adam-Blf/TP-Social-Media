import express from 'express';
import { body, param } from 'express-validator';
import { handleAsync, validateRequest } from '../utils/validators.mjs';

const buildUsersRouter = ({ User }) => {
  const router = express.Router();

  // Liste tous les utilisateurs sans filtrage pour alimenter les sélecteurs de l’interface
  router.get('/', handleAsync(async (req, res) => {
    const users = await User.find().lean({ virtuals: true });
    res.json(users);
  }));

  // Création d’un compte en validant les champs clés côté API
  router.post('/',
    body('firstName').isString().trim().isLength({ min: 2, max: 50 }),
    body('lastName').isString().trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('avatarUrl').optional().isURL(),
    body('bio').optional().isLength({ max: 280 }),
    validateRequest,
    handleAsync(async (req, res) => {
      const user = await User.create(req.body);
      res.status(201).json(user.toJSON());
    }));

  // Récupère un profil précis grâce à son identifiant MongoDB
  router.get('/:id',
    param('id').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const user = await User.findById(req.params.id).lean({ virtuals: true });
      if (!user) {
        res.status(404).json({ code: 404, message: 'User not found' });
        return;
      }
      res.json(user);
    }));

  // Permet une mise à jour partielle du profil utilisateur
  router.patch('/:id',
    param('id').isMongoId(),
    body('firstName').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('lastName').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('avatarUrl').optional().isURL(),
    body('bio').optional().isLength({ max: 280 }),
    validateRequest,
    handleAsync(async (req, res) => {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      }).lean({ virtuals: true });

      if (!user) {
        res.status(404).json({ code: 404, message: 'User not found' });
        return;
      }

      res.json(user);
    }));

  // Supprime un utilisateur et renvoie la dernière version connue
  router.delete('/:id',
    param('id').isMongoId(),
    validateRequest,
    handleAsync(async (req, res) => {
      const user = await User.findByIdAndDelete(req.params.id).lean({ virtuals: true });
      if (!user) {
        res.status(404).json({ code: 404, message: 'User not found' });
        return;
      }
      res.json(user);
    }));

  return router;
};

export default buildUsersRouter;
