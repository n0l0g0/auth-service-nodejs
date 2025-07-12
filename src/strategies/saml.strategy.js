const passport = require('passport');
const { Strategy: SamlStrategy } = require('@node-saml/passport-saml');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
require('dotenv').config();

// ตัวแปรสภาพแวดล้อมสำหรับการกำหนดค่า SAML
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'test-realm';
const SAML_ENTITY_ID = process.env.SAML_ENTITY_ID || 'mini-microservice';
const SAML_CALLBACK_URL =
  process.env.SAML_CALLBACK_URL ||
  'http://localhost:8085/api/auth/saml/callback';

// กำหนดพาธของไฟล์รหัสลับและใบรับรอง
const privateKeyPath = path.resolve(process.cwd(), 'certs/sp-key.pem');
const idpCertPath = path.resolve(process.cwd(), 'certs/saml.cert');

try {
  // ตรวจสอบการมีอยู่ของไฟล์รหัสลับและใบรับรอง
  let privateKey = '';
  let idpCert = '';

  try {
    if (fs.existsSync(privateKeyPath)) {
      privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    } else {
      logger.warn(`ไม่พบไฟล์รหัสลับ SAML ที่: ${privateKeyPath}`);
    }

    if (fs.existsSync(idpCertPath)) {
      idpCert = fs.readFileSync(idpCertPath, 'utf8');
    } else {
      logger.warn(`ไม่พบไฟล์ใบรับรอง SAML ที่: ${idpCertPath}`);
    }
  } catch (fileError) {
    logger.error('เกิดข้อผิดพลาดในการอ่านไฟล์ใบรับรอง SAML:', fileError);
  }

  // กำหนดตัวเลือกสำหรับ SAML Strategy
  const samlOptions = {
    entryPoint: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/saml`,
    issuer: SAML_ENTITY_ID,
    callbackUrl: SAML_CALLBACK_URL,
    idpCert: idpCert || '', // ใช้ค่าว่างหากไม่มีไฟล์
    wantAssertionsSigned: false,
    disableRequestedAuthnContext: true,
    acceptedClockSkewMs: 5000,
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
    forceAuthn: false
  };

  if (privateKey) {
    samlOptions.privateKey = privateKey;
  }

  // สร้าง SAML Strategy
  passport.use(
    'saml',
    new SamlStrategy(samlOptions, (profile, done) => {
      // ตรวจสอบข้อมูลผู้ใช้จาก profile ที่ได้รับจาก SAML
      if (!profile) {
        return done(new Error('ไม่มีข้อมูลผู้ใช้จาก SAML'), null);
      }

      // สร้างข้อมูลผู้ใช้จาก profile
      const user = {
        id: profile.nameID || profile.nameId,
        username: profile.nameID || profile.nameId,
        email: profile.email || profile.mail,
        firstName: profile.firstName || profile.givenName || '',
        lastName: profile.lastName || profile.surname || ''
      };

      return done(null, user);
    })
  );
} catch (error) {
  logger.error('ไม่สามารถกำหนดค่า SAML Strategy ได้:', error);
  // กำหนด dummy strategy เพื่อไม่ให้โปรแกรมหยุดทำงาน
  passport.use(
    'saml',
    new SamlStrategy(
      {
        entryPoint: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/saml`,
        issuer: SAML_ENTITY_ID,
        callbackUrl: SAML_CALLBACK_URL
      },
      (profile, done) => {
        return done(new Error('การกำหนดค่า SAML ไม่ถูกต้อง'), null);
      }
    )
  );
}

module.exports = passport;
