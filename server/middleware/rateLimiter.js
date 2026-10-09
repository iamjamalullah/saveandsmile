const rateLimit = require('express-rate-limit');

// General API Rate Limiter (e.g. 200 requests per 15 mins)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Stricter limiter for Auth / Login routes (e.g. 10 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  }
});

// Checkout / Order creation limiter (e.g. 30 requests per 15 mins)
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many checkout requests, please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  checkoutLimiter
};
