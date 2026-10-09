const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { connectMssql, getPool, sql } = require('../config/mssql');

async function initMSSQL() {
  console.log('--- Initializing Microsoft SQL Server Database ---');
  try {
    const pool = await connectMssql();
    if (!pool) {
      console.error('Failed to connect to MSSQL. Please check your MSSQL credentials in .env.');
      process.exit(1);
    }

    console.log('Connected to MSSQL. Applying schema tables...');
    const schemaSqlPath = path.join(__dirname, '../models/mssqlSchema.sql');
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');

    // Split batches by GO if present or execute directly
    const commands = schemaSql.split(/^\s*GO\s*$/im);
    for (const cmd of commands) {
      if (cmd.trim()) {
        try {
          await pool.request().query(cmd);
        } catch (cmdErr) {
          console.warn('Notice during schema execution:', cmdErr.message);
        }
      }
    }
    console.log('Schema tables verified successfully.');

    // 1. Seed Admin User
    const adminCheck = await pool.request()
      .input('username', sql.NVarChar(100), 'admin')
      .query('SELECT id FROM Users WHERE username = @username');

    if (!adminCheck.recordset || adminCheck.recordset.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);

      await pool.request()
        .input('username', sql.NVarChar(100), 'admin')
        .input('email', sql.NVarChar(255), 'admin@saveandsmile.pk')
        .input('passwordHash', sql.NVarChar(255), hash)
        .input('fullName', sql.NVarChar(200), 'Save & Smile Admin')
        .input('role', sql.NVarChar(50), 'Admin')
        .query(`
          INSERT INTO Users (username, email, password_hash, full_name, role, is_active)
          VALUES (@username, @email, @passwordHash, @fullName, @role, 1)
        `);
      console.log('Seeded default admin user: admin / admin123');
    }

    // 2. Seed Default Categories
    const catCheck = await pool.request().query('SELECT COUNT(*) AS count FROM Categories');
    if (catCheck.recordset[0].count === 0) {
      const categories = [
        { name: 'Kitchen & Dining', slug: 'kitchen-dining', icon: 'fa-utensils' },
        { name: 'Home & Living', slug: 'home-living', icon: 'fa-couch' },
        { name: 'Bathroom Accessories', slug: 'bathroom-accessories', icon: 'fa-bath' },
        { name: 'Storage & Organization', slug: 'storage-organization', icon: 'fa-boxes-stacked' },
        { name: 'Gadgets & Electronics', slug: 'gadgets-electronics', icon: 'fa-microchip' },
        { name: 'Fashion & Bags', slug: 'fashion-bags', icon: 'fa-bag-shopping' }
      ];

      for (const cat of categories) {
        await pool.request()
          .input('name', sql.NVarChar(100), cat.name)
          .input('slug', sql.NVarChar(100), cat.slug)
          .input('icon', sql.NVarChar(100), cat.icon)
          .query(`
            INSERT INTO Categories (name, slug, icon, is_active)
            VALUES (@name, @slug, @icon, 1)
          `);
      }
      console.log('Seeded default categories.');
    }

    // 3. Seed Products from products.json if empty
    const prodCheck = await pool.request().query('SELECT COUNT(*) AS count FROM Products');
    if (prodCheck.recordset[0].count === 0) {
      const productsJsonPath = path.join(__dirname, '../../products.json');
      if (fs.existsSync(productsJsonPath)) {
        const productsData = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
        console.log(`Importing ${productsData.length} products from products.json...`);

        for (const item of productsData) {
          const sku = item.code || `SKU-${item.id}`;
          const code = item.code || sku;
          const name = item.title || `Product ${item.id}`;
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 100) + `-${item.id}`;

          await pool.request()
            .input('sku', sql.NVarChar(100), sku)
            .input('code', sql.NVarChar(100), code)
            .input('name', sql.NVarChar(255), name)
            .input('title', sql.NVarChar(255), name)
            .input('slug', sql.NVarChar(255), slug)
            .input('price', sql.Decimal(12, 2), parseFloat(item.price) || 0)
            .input('stock', sql.Int, 100)
            .input('image', sql.NVarChar(sql.MAX), item.image || null)
            .query(`
              INSERT INTO Products (sku, code, name, title, slug, price, stock_quantity, image_url, is_active)
              VALUES (@sku, @code, @name, @title, @slug, @price, @stock, @image, 1)
            `);
        }
        console.log(`Successfully imported ${productsData.length} products into MSSQL Products table.`);
      }
    }

    console.log('MSSQL database initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing MSSQL database:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  initMSSQL();
}

module.exports = { initMSSQL };
