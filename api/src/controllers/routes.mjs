import buildUsersRouter from './users-controller.mjs';
import buildGroupsRouter from './groups-controller.mjs';
import buildEventsRouter from './events-controller.mjs';

const registerRoutes = (app, models) => {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/users', buildUsersRouter(models));
  app.use('/groups', buildGroupsRouter(models));
  app.use('/events', buildEventsRouter(models));
};

export default registerRoutes;
