const { User } = require('../models');

// ดึงข้อมูลผู้ใช้ทั้งหมด
const getAllUsers = async (req, res) => {
  try {
    // ดึงข้อมูลผู้ใช้ทั้งหมด
    const users = await User.findAll();

    return res.status(200).json({
      message: 'ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ',
      count: users.length,
      users
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
      error: error.message
    });
  }
};

// ดึงข้อมูลผู้ใช้ตาม ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // ค้นหาผู้ใช้ตาม ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: 'ไม่พบผู้ใช้'
      });
    }

    return res.status(200).json({
      message: 'ดึงข้อมูลผู้ใช้สำเร็จ',
      user
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
      error: error.message
    });
  }
};

// อัปเดตข้อมูลผู้ใช้
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullname, is_active, required_duo } = req.body;

    // ค้นหาผู้ใช้ตาม ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: 'ไม่พบผู้ใช้'
      });
    }

    // อัปเดตข้อมูลที่ส่งมา
    if (email !== undefined) user.email = email;
    if (fullname !== undefined) user.fullname = fullname;
    if (is_active !== undefined) user.is_active = is_active;
    if (required_duo !== undefined) user.required_duo = required_duo;

    // บันทึกการเปลี่ยนแปลง
    await user.save();

    return res.status(200).json({
      message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        required_duo: user.required_duo,
        duo_verified: user.duo_verified,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้',
      error: error.message
    });
  }
};

// ลบผู้ใช้
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ค้นหาผู้ใช้ตาม ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: 'ไม่พบผู้ใช้'
      });
    }

    // ลบผู้ใช้
    await user.destroy();

    return res.status(200).json({
      message: 'ลบผู้ใช้สำเร็จ'
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบผู้ใช้:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการลบผู้ใช้',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
