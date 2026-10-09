const { getStoreSettingsCollection, isMongoConnected } = require('../config/mongo');

const defaultSettings = {
  storeName: 'Save & Smile',
  currency: 'Rs.',
  phone: '+92 300 1234567',
  email: 'info@saveandsmile.pk',
  address: 'Karachi, Pakistan',
  deliveryFee: 200,
  freeShippingThreshold: 2000,
  announcementText: '🌟 Free Shipping on orders over Rs. 2,000 across Pakistan! Cash on Delivery Available 🚚',
  enableCod: true,
  enableReviews: true
};

/**
 * Get Store Settings
 */
async function getSettings(req, res, next) {
  try {
    if (isMongoConnected()) {
      const collection = getStoreSettingsCollection();
      const settingsDoc = await collection.findOne({ key: 'global_settings' });
      if (settingsDoc && settingsDoc.value) {
        return res.json({ success: true, settings: settingsDoc.value });
      }
    }
    return res.json({ success: true, settings: defaultSettings });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Store Settings
 */
async function updateSettings(req, res, next) {
  try {
    const newSettings = { ...defaultSettings, ...req.body };

    if (isMongoConnected()) {
      const collection = getStoreSettingsCollection();
      await collection.updateOne(
        { key: 'global_settings' },
        {
          $set: {
            key: 'global_settings',
            value: newSettings,
            updatedAt: new Date(),
            updatedBy: req.user ? req.user.username : 'admin'
          }
        },
        { upsert: true }
      );

      if (req.logAudit) {
        req.logAudit('UPDATE_SETTINGS', 'Settings', 'global', newSettings);
      }

      return res.json({ success: true, message: 'Settings saved to MongoDB.', settings: newSettings });
    }

    Object.assign(defaultSettings, req.body);
    return res.json({ success: true, message: 'Settings updated (memory mode).', settings: defaultSettings });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings
};
