const { body, validationResult } = require('express-validator');

// ฟังก์ชันสำหรับตรวจสอบผลลัพธ์การตรวจสอบ
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ตรวจสอบข้อมูลสำหรับการลงทะเบียน
const registerValidation = [
  body('username')
    .notEmpty()
    .withMessage('กรุณาระบุชื่อผู้ใช้')
    .isString()
    .withMessage('ชื่อผู้ใช้ต้องเป็นข้อความ')
    .isLength({ min: 3 })
    .withMessage('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),

  body('email')
    .notEmpty()
    .withMessage('กรุณาระบุอีเมล')
    .isEmail()
    .withMessage('รูปแบบอีเมลไม่ถูกต้อง'),

  body('password')
    .notEmpty()
    .withMessage('กรุณาระบุรหัสผ่าน')
    .isLength({ min: 6 })
    .withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),

  body('fullname')
    .optional()
    .isString()
    .withMessage('ชื่อ-นามสกุลต้องเป็นข้อความ'),

  validate
];

// ตรวจสอบข้อมูลสำหรับการเข้าสู่ระบบ
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('กรุณาระบุชื่อผู้ใช้')
    .isString()
    .withMessage('ชื่อผู้ใช้ต้องเป็นข้อความ'),

  body('password')
    .notEmpty()
    .withMessage('กรุณาระบุรหัสผ่าน')
    .isString()
    .withMessage('รหัสผ่านต้องเป็นข้อความ'),

  validate
];

// ตรวจสอบข้อมูลสำหรับการอัปเดตผู้ใช้
const updateUserValidation = [
  body('email').optional().isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),

  body('fullname')
    .optional()
    .isString()
    .withMessage('ชื่อ-นามสกุลต้องเป็นข้อความ'),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),

  body('is_active').optional().isBoolean().withMessage('สถานะต้องเป็น boolean'),

  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  updateUserValidation,
  validate
};
