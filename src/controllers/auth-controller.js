const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User } = require('../models');
const duoService = require('../services/duo-service');
const logger = require('../config/logger');
require('dotenv').config();

// สร้าง JWT token
const generateToken = (user) => {
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    requiredDuo: user.required_duo,
    duoVerified: user.duo_verified,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

// ออกจากระบบ (ลบ HttpOnly Cookie)
const logout = (req, res) => {
  // ลบ HttpOnly Cookie โดยการตั้งค่า expires ให้เป็นอดีต
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  return res.status(200).json({
    message: 'ออกจากระบบสำเร็จ'
  });
};

/**
 * ตรวจสอบสถานะบริการ Duo Security
 */
const duoHealthCheck = (req, res) => {
  return res.status(200).json(duoService.healthCheck());
};

/**
 * เริ่มกระบวนการยืนยันตัวตนด้วย SAML
 * ฟังก์ชันนี้จะเรียกใช้ SAML Strategy ของ Passport.js
 */
const samlLogin = (req, res, next) => {
  passport.authenticate('saml', {
    failureRedirect: '/api/auth/login',
    failureFlash: true
  })(req, res, next);
};

/**
 * รับข้อมูลหลังจากการยืนยันตัวตนด้วย SAML
 */
const samlCallback = async (req, res, next) => {
  passport.authenticate('saml', async (err, samlUser) => {
    if (err) {
      logger.error('SAML Authentication error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=saml_error`);
    }

    if (!samlUser) {
      logger.error('No SAML user returned');
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=no_saml_user`
      );
    }

    try {
      // ค้นหาผู้ใช้จากอีเมลหรือ username
      let user = await User.findOne({
        where: {
          [User.sequelize.Sequelize.Op.or]: [
            { email: samlUser.email },
            { username: samlUser.username }
          ]
        }
      });

      // ถ้าไม่พบผู้ใช้ ทำการสร้างผู้ใช้ใหม่
      if (!user) {
        logger.debug(`Creating new user from SAML: ${samlUser.username}`);
        user = await User.create({
          username: samlUser.username,
          email: samlUser.email,
          fullname: `${samlUser.firstName} ${samlUser.lastName}`.trim(),
          required_duo: true,
          duo_verified: false,
          is_active: true
        });
      }

      // ถ้าผู้ใช้ต้องยืนยันตัวตนด้วย Duo
      if (user.required_duo) {
        // && !user.duo_verified เอาไปใส่ในเงื่อนไขด้านบนถ้าไม่ต้องการให้ผู้ใช้ยืนยันตัวตนด้วย Duo ตลอด
        const duoAuthUrl = await duoService.initiateDuoAuth(user);
        logger.debug('Duo authentication URL:', duoAuthUrl);
        return res.redirect(duoAuthUrl);
      }

      // สร้าง token และเข้าสู่ระบบ
      const token = generateToken(user);
      res.cookie('auth_token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 ชั่วโมง
        path: '/'
      });
      return res.redirect(
        `${process.env.FRONTEND_URL}/login/success`
      );
    } catch (error) {
      logger.error('Error processing SAML callback:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=saml_processing_error`
      );
    }
  })(req, res, next);
};

/**
 * รับข้อมูลหลังจากการยืนยันตัวตนด้วย Duo Security
 */
const duoCallback = async (req, res) => {
  const { state, duo_code } = req.query;

  if (!state || !duo_code) {
    logger.error('Missing state or duo_code in query params');
    return res.status(400).json({
      success: false,
      message: 'พารามิเตอร์สำหรับ Duo callback ไม่ถูกต้อง'
    });
  }

  try {
    const duoVerify = {
      username: req.user?.username,
      state: state,
      duo_code: duo_code
    };

    const result = await duoService.verifyDuoResponse(duoVerify);
    logger.debug('Duo verification result:', result);

    if (result.verified && result.user) {
      const token = generateToken(result.user);
      res.cookie('auth_token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 ชั่วโมง
        path: '/'
      });
      return res.redirect(
        `${process.env.FRONTEND_URL}/login/success`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=duo_verification_failed`
      );
    }
  } catch (error) {
    logger.error('Error during Duo callback:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดระหว่างการยืนยันตัวตนด้วย Duo Security'
    });
  }
};

/**
 * ดึงข้อมูลของผู้ใช้ที่เข้าสู่ระบบ
 */
const me = async (req, res) => {
  try {
    logger.debug(
      `Getting user data for ID: ${req.user.id}, duoVerified: ${req.user.duoVerified}`
    );

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    // ถ้า token บอกว่าผู้ใช้ผ่านการยืนยัน Duo แล้ว แต่ในฐานข้อมูลยังไม่ได้อัปเดต
    if (req.user.duoVerified && !user.duo_verified) {
      logger.debug(
        `Updating duoVerified in database for user ${user.username}`
      );
      user.duo_verified = true;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.fullname,
        requiresDuo: user.required_duo,
        duoVerified: user.duo_verified
      }
    });
  } catch (error) {
    logger.error('Error getting current user:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    });
  }
};

module.exports = {
  logout,
  generateToken,
  duoHealthCheck,
  samlLogin,
  samlCallback,
  duoCallback,
  me
};
