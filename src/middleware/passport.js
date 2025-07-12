const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models');
require('dotenv').config();

// กลยุทธ์ JWT - ใช้สำหรับการยืนยันตัวตนด้วย Token
// ฟังก์ชันสำหรับดึง JWT token จาก HttpOnly Cookie
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['auth_token'];
  }
  return token;
};

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    cookieExtractor, // ลองดึงจาก cookie ก่อน
    ExtractJwt.fromAuthHeaderAsBearerToken() // fallback ไปยัง Authorization header
  ]),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // ค้นหาผู้ใช้จาก ID ใน payload
      const user = await User.findByPk(payload.sub);

      if (!user) {
        return done(null, false);
      }

      // ตรวจสอบว่าผู้ใช้ active หรือไม่
      if (!user.is_active) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// กลยุทธ์ Local - ใช้สำหรับการล็อกอินด้วย username และ password
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      try {
        // ค้นหาผู้ใช้จาก username
        const user = await User.findOne({ where: { username } });

        if (!user) {
          return done(null, false, { message: 'ไม่พบผู้ใช้' });
        }

        // ตรวจสอบรหัสผ่าน
        const isValidPassword = await user.isValidPassword(password);

        if (!isValidPassword) {
          return done(null, false, { message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // ตรวจสอบว่าผู้ใช้ active หรือไม่
        if (!user.is_active) {
          return done(null, false, { message: 'บัญชีถูกระงับการใช้งาน' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
