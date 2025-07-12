const express = require('express');
const router = express.Router();
const authRoutes = require('./auth-routes');
const usersRoutes = require('./users-routes');

// เส้นทาง API สำหรับการตรวจสอบสิทธิ์ผู้ใช้
router.use('/auth', authRoutes);

// เส้นทาง API สำหรับจัดการผู้ใช้
router.use('/users', usersRoutes);

// เส้นทางหลักสำหรับตรวจสอบสถานะ API
router.get('/', (req, res) => {
  res.json({
    message: 'ยินดีต้อนรับสู่ Auth Service สำหรับจัดการข้อมูลผู้ใช้',
    version: '1.0.0',
    status: 'online'
  });
});

module.exports = router;
