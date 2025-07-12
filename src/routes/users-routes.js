const express = require('express');
const passport = require('passport');
const { updateUserValidation } = require('../middleware/validators');
const userController = require('../controllers/user-controller');

const router = express.Router();

// Middleware สำหรับตรวจสอบ JWT token
const authenticate = passport.authenticate('jwt', { session: false });

router.get('/', authenticate, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.put(
  '/:id',
  authenticate,
  updateUserValidation,
  userController.updateUser
);
router.delete('/:id', authenticate, userController.deleteUser);

module.exports = router;
