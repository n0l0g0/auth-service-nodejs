const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth-controller');
const passport = require('passport');
require('../strategies/saml.strategy');

router.post('/logout', authController.logout);
router.get('/duo/health', authController.duoHealthCheck);
router.get('/duo/callback', authController.duoCallback);
router.get('/saml', authController.samlLogin);
router.post('/saml/callback', authController.samlCallback);
router.get(
  '/me',
  passport.authenticate('jwt', { session: false }),
  authController.me
);

module.exports = router;
