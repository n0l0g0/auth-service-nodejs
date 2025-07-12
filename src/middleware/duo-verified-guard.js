const logger = require('../config/logger');
const { User } = require('../models');

/**
 * ตรวจสอบว่าผู้ใช้ได้ผ่านการยืนยันตัวตนด้วย Duo Security
 * @param {boolean} bypassIfNotRequired - หากตั้งค่าเป็น true จะอนุญาตให้ผ่านได้หากผู้ใช้ไม่จำเป็นต้องใช้ Duo
 */
const duoVerifiedGuard = (bypassIfNotRequired = false) => {
  return async (req, res, next) => {
    try {
      // หากไม่มีข้อมูลผู้ใช้ใน request แสดงว่ายังไม่ได้ผ่านการยืนยันตัวตนเบื้องต้น
      if (!req.user) {
        logger.warn('No user object found in request');
        return res.status(401).json({
          success: false,
          message: 'จำเป็นต้องเข้าสู่ระบบก่อน'
        });
      }

      // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
      const user = await User.findByPk(req.user.id);

      if (!user) {
        logger.warn(`User with ID ${req.user.id} not found in database`);
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // ตรวจสอบว่าผู้ใช้ต้องการการยืนยันด้วย Duo หรือไม่
      if (!user.required_duo && bypassIfNotRequired) {
        // หากผู้ใช้ไม่จำเป็นต้องใช้ Duo และตั้งค่าให้ข้ามได้ ให้ผ่านไปได้เลย
        return next();
      }

      // ตรวจสอบว่าผู้ใช้ได้ผ่านการยืนยันด้วย Duo แล้วหรือไม่
      if (!user.duo_verified) {
        logger.warn(`User ${user.username} has not completed Duo verification`);
        return res.status(401).json({
          success: false,
          message: 'จำเป็นต้องยืนยันตัวตนด้วย Duo Security',
          redirectUrl: '/api/auth/duo/auth'
        });
      }

      // เพิ่มข้อมูลว่าผู้ใช้ผ่านการยืนยัน Duo แล้ว
      req.user.duoVerified = true;
      next();
    } catch (error) {
      logger.error('Error in duoVerifiedGuard:', error);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบการยืนยัน Duo'
      });
    }
  };
};

module.exports = duoVerifiedGuard;
