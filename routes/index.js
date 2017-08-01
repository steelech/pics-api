const routes = require('express').Router();
const login = require('./login');
const session = require('./session');
const pics = require('./pics');

routes.use('/pics', pics);
routes.use('/session', session);
routes.use('/login', login);
routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

module.exports = routes;
