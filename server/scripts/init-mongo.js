const { connectMongo, initMongoIndexes, getStoreSettingsCollection } = require('../config/mongo');

async function initMongo() {
  console.log('--- Initializing MongoDB Database ---');
  try {
    const db = await connectMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB. Please check your MongoDB URI in .env.');
      process.exit(1);
    }

    console.log('Creating indexes for audit_logs, store_settings, and search_analytics...');
    await initMongoIndexes();

    // Seed default store settings if missing
    const settingsColl = getStoreSettingsCollection();
    const existing = await settingsColl.findOne({ key: 'global_settings' });

    if (!existing) {
      await settingsColl.insertOne({
        key: 'global_settings',
        value: {
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
        },
        updatedAt: new Date(),
        updatedBy: 'system'
      });
      console.log('Seeded default store settings in MongoDB.');
    }

    console.log('MongoDB initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing MongoDB:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  initMongo();
}

module.exports = { initMongo };
