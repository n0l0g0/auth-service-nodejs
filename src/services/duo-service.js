const { Client } = require('@duosecurity/duo_universal');
const logger = require('../config/logger');
const { User } = require('../models');
require('dotenv').config();

class DuoService {
  constructor() {
    try {
      const duoClientId = process.env.DUO_CLIENT_ID;
      const duoClientSecret = process.env.DUO_CLIENT_SECRET;
      const duoApiHost = process.env.DUO_API_HOST;
      const redirectUrl = process.env.DUO_REDIRECT_URL;

      if (duoClientId && duoClientSecret && duoApiHost && redirectUrl) {
        this.duoClient = new Client({
          clientId: duoClientId,
          clientSecret: duoClientSecret,
          apiHost: duoApiHost,
          redirectUrl: redirectUrl
        });
        logger.info('Duo Security client initialized successfully');
      } else {
        logger.warn('Duo configuration missing, MFA will be disabled');
        this.duoClient = null;
      }
    } catch (error) {
      logger.error('Duo client initialization failed', error);
      this.duoClient = null;
    }
  }

  /**
   * เริ่มกระบวนการยืนยันตัวตนด้วย Duo Security
   * @param {Object} user - ข้อมูลผู้ใช้
   * @returns {Promise<string>} - URL สำหรับการยืนยันตัวตน
   */
  async initiateDuoAuth(user) {
    try {
      if (!this.duoClient) {
        logger.warn('Duo client not initialized, skipping MFA');

        // อัปเดตสถานะผู้ใช้เป็นผ่านการยืนยันแล้ว
        await User.update({ duo_verified: true }, { where: { id: user.id } });

        return `${process.env.FRONTEND_URL}`; // ข้ามไปหน้า home เลย
      }

      // สร้าง state สำหรับการตรวจสอบ callback
      const state = this.duoClient.generateState();
      const encodedState = `${state}|${encodeURIComponent(user.username)}`;

      // เริ่มกระบวนการยืนยันตัวตน
      const authUrl = this.duoClient.createAuthUrl(user.username, encodedState);

      return authUrl;
    } catch (error) {
      logger.error('Error initiating Duo auth:', error);
      throw new Error('Failed to initialize Duo MFA');
    }
  }

  /**
   * ตรวจสอบการตอบกลับจาก Duo Security
   * @param {Object} duoVerify - ข้อมูลการยืนยันจาก Duo
   * @returns {Promise<Object>} - ผลลัพธ์การยืนยัน
   */
  async verifyDuoResponse(duoVerify) {
    logger.debug('Duo verification request:', duoVerify);
    try {
      if (!this.duoClient) {
        throw new Error('Duo client not configured');
      }

      // แยก state เพื่อดึง username
      const [, encodedUsername] = duoVerify.state.split('|');
      const username = encodedUsername
        ? decodeURIComponent(encodedUsername)
        : duoVerify.username;

      // ตรวจสอบการตอบกลับจาก Duo
      const duoUsername =
        await this.duoClient.exchangeAuthorizationCodeFor2FAResult(
          duoVerify.duo_code,
          username
        );
      logger.debug('Duo verification response:', duoUsername);

      // ค้นหาผู้ใช้จาก username
      const user = await User.findOne({ where: { username } });

      if (!user) {
        throw new Error('User not found');
      }

      // อัปเดตสถานะการยืนยันตัวตน
      user.duo_verified = true;
      await user.save();

      return { verified: true, user };
    } catch (error) {
      logger.error('Duo verification failed', error);
      return { verified: false, user: null };
    }
  }

  /**
   * ตรวจสอบสถานะของบริการ Duo Security
   * @returns {Object} - สถานะของบริการ
   */
  healthCheck() {
    return {
      success: true,
      service: 'duo-security',
      status: this.duoClient ? 'available' : 'unavailable',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new DuoService();
