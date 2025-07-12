# Auth Service - Node.js Express

Service สำหรับยืนยันตัวตนและจัดการผู้ใช้สำหรับระบบจัดการอากาศยาน พัฒนาด้วย Node.js และ Express

## คุณสมบัติหลัก

- ระบบลงทะเบียนและเข้าสู่ระบบด้วย username/password
- รองรับ RESTful API สำหรับการดำเนินการ Authentication และ User Management
- ยืนยันตัวตนด้วย JWT (JSON Web Token)
- รองรับการยืนยันตัวตนด้วย Duo Security (2FA)
- มีเอกสาร API ด้วย Swagger/OpenAPI
- ระบบตรวจสอบความถูกต้องของข้อมูลด้วย Middleware

### เทคโนโลยีหลักที่ใช้
- **Node.js**: Runtime สำหรับการทำงานของแอปพลิเคชัน
- **Express.js**: เฟรมเวิร์คสำหรับการสร้าง API
- **Sequelize**: ORM สำหรับการจัดการฐานข้อมูล
- **PostgreSQL**: ฐานข้อมูลหลักที่ใช้จัดเก็บข้อมูล
- **JWT**: สำหรับการยืนยันตัวตนและการจัดการ Token
- **Passport.js**: สำหรับการจัดการ Authentication Strategy
- **Duo Security**: สำหรับการยืนยันตัวตนแบบ 2FA
- **Swagger/OpenAPI**: สำหรับการสร้างเอกสาร API

## การติดตั้ง

1. clone โปรเจคจาก repo
```bash
git clone <repository-url>
cd auth-service-nodejs
```

2. ติดตั้งแพ็คเกจที่จำเป็น
```bash
npm install
```

3. สร้างไฟล์ `.env` โดยคัดลอกจาก `.env.example`:
```bash
cp .env.example .env
```
4. แก้ไขไฟล์ `.env` ให้ตรงกับการตั้งค่าฐานข้อมูลของคุณ

## การใช้งาน

### run ในโหมด development
```bash
npm run dev
```

### unit test
```bash
npm test
```
## โครงสร้างโปรเจค

```
auth-service-nodejs/
├── src/                    # โค้ดหลัก
│   ├── config/             # config ค่าต่างๆ (ฐานข้อมูล, ฯลฯ)
│   ├── controllers/        # controllers สำหรับจัดการ logic API
│   ├── middleware/         # middleware ตัวกลาง (Passport, Validators, ฯลฯ)
│   ├── models/             # โมเดลข้อมูล (Sequelize)
│   ├── routes/             # เส้นทาง API
│   ├── services/           # services ต่างๆ
│   ├── strategies/         # Authentication strategies
│   ├── utils/              # fn.และยูทิลิตี้ที่ใช้ร่วมกัน
│   └── index.js            # จุดเริ่มต้นแอปพลิเคชัน
├── certs/                  # ใบรับรองและคีย์สำหรับ SAML
├── tests/                  # ไฟล์ unit test
├── .env.example            # ตัวอย่าง env
├── .gitignore              # ไฟล์ที่ต้องการยกเว้นจาก Git
└── package.json            # การจัดการแพ็คเกจและสคริปต์
```

## API Endpoints

เอกสาร API แบบละเอียดสามารถเข้าดูได้ที่ `http://localhost:8085/docs` หลังจาก run app
