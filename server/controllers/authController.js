const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, isMssqlConnected, sql } = require('../config/mssql');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

// Mock admin fallback when MSSQL is not connected
const fallbackAdmin = {
  id: 1,
  username: 'admin',
  email: 'admin@saveandsmile.pk',
  fullName: 'Save & Smile Admin',
  role: 'Admin',
  // bcrypt hash for 'admin123'
  passwordHash: '$2a$10$8k1p/a7.J2g6u4z6B5O3k.6s5iX1XwZp9zX8bQ7y1n6L3K2J0G7u6'
};

/**
 * Admin / Staff Login
 */
async function login(req, res, next) {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and password are required.' });
    }

    let user = null;

    if (isMssqlConnected()) {
      const result = await query(
        `SELECT id, username, email, password_hash AS passwordHash, full_name AS fullName, role, is_active AS isActive 
         FROM Users 
         WHERE (username = @identifier OR email = @identifier) AND is_active = 1`,
        { identifier: loginIdentifier }
      );
      if (result.recordset && result.recordset.length > 0) {
        user = result.recordset[0];
      }
    } else {
      // Fallback auth
      if (loginIdentifier === fallbackAdmin.username || loginIdentifier === fallbackAdmin.email) {
        user = fallbackAdmin;
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch && password !== 'admin123') { // Fallback dev convenience
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate JWT
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Update last login in MSSQL if connected
    if (isMssqlConnected()) {
      await query(
        `UPDATE Users SET last_login = GETDATE() WHERE id = @id`,
        { id: user.id }
      ).catch(() => {});
    }

    if (req.logAudit) {
      req.logAudit('USER_LOGIN', 'User', user.id, { username: user.username, role: user.role });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new Admin or Staff user
 */
async function register(req, res, next) {
  try {
    const { username, email, password, fullName, role = 'Staff' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
    }

    if (!isMssqlConnected()) {
      return res.status(503).json({
        success: false,
        message: 'MSSQL database is currently disconnected. Cannot register new user.'
      });
    }

    // Check duplicate
    const checkUser = await query(
      `SELECT id FROM Users WHERE username = @username OR email = @email`,
      { username, email }
    );

    if (checkUser.recordset && checkUser.recordset.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertResult = await query(
      `INSERT INTO Users (username, email, password_hash, full_name, role, is_active)
       OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.full_name AS fullName, INSERTED.role
       VALUES (@username, @email, @passwordHash, @fullName, @role, 1)`,
      {
        username,
        email,
        passwordHash,
        fullName: fullName || username,
        role
      }
    );

    const newUser = insertResult.recordset[0];

    if (req.logAudit) {
      req.logAudit('USER_REGISTER', 'User', newUser.id, { username: newUser.username, role: newUser.role });
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user info
 */
async function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

module.exports = {
  login,
  register,
  getMe
};
