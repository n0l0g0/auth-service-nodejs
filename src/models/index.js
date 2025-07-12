/**
 * Auth Service Models
 * ใช้ User model สำหรับ authentication
 */

const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// สร้าง User model
const createUserModel = require('./user');
const User = createUserModel(sequelize, DataTypes);

// Export models สำหรับใช้งานใน auth service
module.exports = { 
  User,
  sequelize,
  Sequelize: require('sequelize')
};
