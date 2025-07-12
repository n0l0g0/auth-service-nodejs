require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const path = require('path');
const YAML = require('yamljs');

// นำเข้ารูปแบบการกำหนดเส้นทาง
const routes = require('./routes');

// นำเข้าการตั้งค่าและ service ต่างๆ
const { sequelize } = require('./config/database');
const logger = require('./config/logger');

// แอพพลิเคชั่นหลัก
const app = express();
const port = process.env.PORT || 8085;

// กำหนดค่า Middleware
app.use(helmet()); // ช่วยเพิ่มความปลอดภัยด้วย HTTP headers

// กำหนดค่า CORS เพื่อรองรับ HttpOnly Cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL ของ frontend
  credentials: true, // อนุญาตให้ส่ง cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // HTTP methods ที่อนุญาต
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers ที่อนุญาต
}));

app.use(express.json()); // แปลงข้อมูล JSON
app.use(express.urlencoded({ extended: true })); // แปลงข้อมูลจากฟอร์ม
app.use(cookieParser()); // แปลงข้อมูล cookies
app.use(morgan('dev')); // บันทึกการเรียก API
app.use(passport.initialize()); // เริ่มต้น Passport.js สำหรับการตรวจสอบสิทธิ์

// นำเข้า middleware สำหรับการตรวจสอบสิทธิ์
require('./middleware/passport');

// ให้ swagger อ่านจากไฟล์ YAML
const swaggerDocument = YAML.load(path.join(__dirname, 'docs/openapi.yaml'));

// กำหนดเส้นทางสำหรับ Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// กำหนด API Prefix
app.use('/api', routes);

// จัดการกับเส้นทางที่ไม่มีอยู่จริง
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// จัดการกับข้อผิดพลาดต่างๆ
app.use((err, req, res) => {
  logger.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// เริ่มต้นเซิร์ฟเวอร์
const startServer = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    await sequelize.authenticate();
    logger.info('Connected to the database successfully');

    // ซิงค์โมเดลกับฐานข้อมูล (ใช้ในโหมด development เท่านั้น)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      logger.info('Sync models with database successfully');
    }

    // เริ่มต้นเซิร์ฟเวอร์
    app.listen(port, () => {
      logger.info(`Application is running on: http://localhost:${port}`);
      logger.info(`Swagger UI available at: http://localhost:${port}/docs`);
    });
  } catch (error) {
    logger.error(`Can't start the server:`, error);
    process.exit(1);
  }
};

startServer();
