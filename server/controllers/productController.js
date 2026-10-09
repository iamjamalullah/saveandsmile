const fs = require('fs');
const path = require('path');
const { query, isMssqlConnected } = require('../config/mssql');
const { getSearchAnalyticsCollection, isMongoConnected } = require('../config/mongo');

// Read fallback JSON products from root or public
const productsJsonPath = path.join(__dirname, '../../products.json');
let cachedJsonProducts = [];
try {
  if (fs.existsSync(productsJsonPath)) {
    cachedJsonProducts = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read fallback products.json:', e.message);
}

/**
 * Get products with filtering, search, pagination, and sorting
 */
async function getProducts(req, res, next) {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      minPrice,
      maxPrice,
      sort = 'newest'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Record search query in MongoDB analytics if search term provided
    if (search && isMongoConnected()) {
      try {
        const analyticsColl = getSearchAnalyticsCollection();
        await analyticsColl.updateOne(
          { query: search.toLowerCase().trim() },
          { $inc: { count: 1 }, $set: { lastSearchedAt: new Date() } },
          { upsert: true }
        );
      } catch (e) {
        // Analytics non-blocking
      }
    }

    if (isMssqlConnected()) {
      let whereClauses = ['p.is_active = 1'];
      const params = {};

      if (search) {
        whereClauses.push('(p.name LIKE @search OR p.title LIKE @search OR p.sku LIKE @search OR p.code LIKE @search OR p.description LIKE @search)');
        params.search = `%${search}%`;
      }

      if (category) {
        whereClauses.push('(c.slug = @category OR c.name = @category OR p.category_id = @category)');
        params.category = category;
      }

      if (minPrice !== undefined && minPrice !== '') {
        whereClauses.push('p.price >= @minPrice');
        params.minPrice = parseFloat(minPrice);
      }

      if (maxPrice !== undefined && maxPrice !== '') {
        whereClauses.push('p.price <= @maxPrice');
        params.maxPrice = parseFloat(maxPrice);
      }

      let orderBy = 'p.created_at DESC';
      if (sort === 'price_asc') orderBy = 'p.price ASC';
      if (sort === 'price_desc') orderBy = 'p.price DESC';
      if (sort === 'title_asc') orderBy = 'p.name ASC';
      if (sort === 'oldest') orderBy = 'p.created_at ASC';

      const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count total
      const countResult = await query(
        `SELECT COUNT(*) AS total FROM Products p LEFT JOIN Categories c ON p.category_id = c.id ${whereSql}`,
        params
      );
      const total = countResult.recordset[0].total;

      // Select page
      const dataResult = await query(
        `SELECT 
          p.id,
          p.sku,
          p.code,
          COALESCE(p.name, p.title) AS title,
          p.name,
          p.slug,
          p.price,
          p.compare_at_price AS comparePrice,
          p.cost_price AS costPrice,
          p.stock_quantity AS stock,
          p.image_url AS image,
          p.description,
          p.rating,
          p.review_count AS reviewCount,
          p.is_featured AS isFeatured,
          p.is_active AS isActive,
          c.id AS categoryId,
          c.name AS categoryName
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.id
        ${whereSql}
        ORDER BY ${orderBy}
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        {
          ...params,
          offset,
          limit: limitNum
        }
      );

      return res.json({
        success: true,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum,
        products: dataResult.recordset
      });
    }

    // JSON Fallback
    let filtered = [...cachedJsonProducts];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    if (minPrice !== undefined && minPrice !== '') {
      filtered = filtered.filter(p => (p.price || 0) >= parseFloat(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      filtered = filtered.filter(p => (p.price || 0) <= parseFloat(maxPrice));
    }

    if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum,
      products: paginated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get product by ID or SKU or Code
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (isMssqlConnected()) {
      const result = await query(
        `SELECT 
          p.id,
          p.sku,
          p.code,
          COALESCE(p.name, p.title) AS title,
          p.name,
          p.slug,
          p.price,
          p.compare_at_price AS comparePrice,
          p.stock_quantity AS stock,
          p.image_url AS image,
          p.description,
          p.rating,
          p.review_count AS reviewCount,
          p.is_featured AS isFeatured,
          c.id AS categoryId,
          c.name AS categoryName
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.id
        WHERE p.id = @id OR p.sku = @id OR p.code = @id OR p.slug = @id`,
        { id }
      );

      if (result.recordset && result.recordset.length > 0) {
        return res.json({ success: true, product: result.recordset[0] });
      }
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // JSON Fallback
    const found = cachedJsonProducts.find(p => String(p.id) === String(id) || p.code === id || p.sku === id);
    if (found) {
      return res.json({ success: true, product: found });
    }

    return res.status(404).json({ success: false, message: 'Product not found.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new product with duplicate SKU check
 */
async function createProduct(req, res, next) {
  try {
    const {
      title,
      name,
      sku,
      code,
      price,
      comparePrice,
      costPrice,
      stock = 100,
      image,
      categoryId,
      description,
      isFeatured = false
    } = req.body;

    const prodTitle = name || title;
    const prodSku = sku || code || `SKU-${Date.now()}`;
    const prodCode = code || prodSku;

    if (!prodTitle || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product title and price are required.' });
    }

    if (isMssqlConnected()) {
      // Duplicate SKU validation
      const skuCheck = await query(`SELECT id FROM Products WHERE sku = @sku OR code = @code`, { sku: prodSku, code: prodCode });
      if (skuCheck.recordset && skuCheck.recordset.length > 0) {
        return res.status(409).json({ success: false, message: `Product with SKU/Code "${prodSku}" already exists.` });
      }

      const slug = prodTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`;

      const insertResult = await query(
        `INSERT INTO Products (
          sku, code, name, title, slug, price, compare_at_price, cost_price,
          stock_quantity, image_url, category_id, description, is_featured, is_active
        )
        OUTPUT INSERTED.*
        VALUES (
          @sku, @code, @name, @title, @slug, @price, @comparePrice, @costPrice,
          @stock, @image, @categoryId, @description, @isFeatured, 1
        )`,
        {
          sku: prodSku,
          code: prodCode,
          name: prodTitle,
          title: prodTitle,
          slug,
          price: parseFloat(price),
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          costPrice: costPrice ? parseFloat(costPrice) : null,
          stock: parseInt(stock, 10) || 0,
          image: image || null,
          categoryId: categoryId || null,
          description: description || null,
          isFeatured: isFeatured ? 1 : 0
        }
      );

      const newProduct = insertResult.recordset[0];

      if (req.logAudit) {
        req.logAudit('CREATE_PRODUCT', 'Product', newProduct.id, { title: prodTitle, sku: prodSku, price });
      }

      return res.status(201).json({
        success: true,
        message: 'Product created successfully in MSSQL.',
        product: newProduct
      });
    }

    // JSON Fallback
    const newProduct = {
      id: String(Date.now()),
      title: prodTitle,
      code: prodCode,
      sku: prodSku,
      price: parseFloat(price),
      image: image || ''
    };
    cachedJsonProducts.unshift(newProduct);

    return res.status(201).json({
      success: true,
      message: 'Product created (memory mode).',
      product: newProduct
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update existing product
 */
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      name,
      price,
      comparePrice,
      costPrice,
      stock,
      image,
      categoryId,
      description,
      isFeatured,
      isActive
    } = req.body;

    if (isMssqlConnected()) {
      const updateResult = await query(
        `UPDATE Products SET
          name = COALESCE(@name, name),
          title = COALESCE(@title, title),
          price = COALESCE(@price, price),
          compare_at_price = COALESCE(@comparePrice, compare_at_price),
          cost_price = COALESCE(@costPrice, cost_price),
          stock_quantity = COALESCE(@stock, stock_quantity),
          image_url = COALESCE(@image, image_url),
          category_id = COALESCE(@categoryId, category_id),
          description = COALESCE(@description, description),
          is_featured = COALESCE(@isFeatured, is_featured),
          is_active = COALESCE(@isActive, is_active),
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id`,
        {
          id,
          name: name || title || null,
          title: title || name || null,
          price: price !== undefined ? parseFloat(price) : null,
          comparePrice: comparePrice !== undefined ? parseFloat(comparePrice) : null,
          costPrice: costPrice !== undefined ? parseFloat(costPrice) : null,
          stock: stock !== undefined ? parseInt(stock, 10) : null,
          image: image || null,
          categoryId: categoryId || null,
          description: description || null,
          isFeatured: isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
          isActive: isActive !== undefined ? (isActive ? 1 : 0) : null
        }
      );

      if (!updateResult.recordset || updateResult.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      if (req.logAudit) {
        req.logAudit('UPDATE_PRODUCT', 'Product', id, req.body);
      }

      return res.json({
        success: true,
        message: 'Product updated successfully.',
        product: updateResult.recordset[0]
      });
    }

    return res.json({
      success: true,
      message: 'Product updated (memory mode).'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete product (Soft delete)
 */
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    if (isMssqlConnected()) {
      await query(`UPDATE Products SET is_active = 0 WHERE id = @id`, { id });
      if (req.logAudit) {
        req.logAudit('DELETE_PRODUCT', 'Product', id, {});
      }
      return res.json({ success: true, message: 'Product deleted successfully.' });
    }

    cachedJsonProducts = cachedJsonProducts.filter(p => String(p.id) !== String(id));
    return res.json({ success: true, message: 'Product deleted (memory mode).' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
