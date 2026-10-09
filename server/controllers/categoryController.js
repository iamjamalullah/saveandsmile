const { query, isMssqlConnected } = require('../config/mssql');

// Fallback categories
const defaultCategories = [
  { id: 1, name: 'Kitchen & Dining', slug: 'kitchen-dining', icon: 'fa-utensils', productCount: 12 },
  { id: 2, name: 'Home & Living', slug: 'home-living', icon: 'fa-couch', productCount: 8 },
  { id: 3, name: 'Bathroom Accessories', slug: 'bathroom-accessories', icon: 'fa-bath', productCount: 6 },
  { id: 4, name: 'Storage & Organization', slug: 'storage-organization', icon: 'fa-boxes-stacked', productCount: 10 },
  { id: 5, name: 'Gadgets & Electronics', slug: 'gadgets-electronics', icon: 'fa-microchip', productCount: 9 },
  { id: 6, name: 'Fashion & Bags', slug: 'fashion-bags', icon: 'fa-bag-shopping', productCount: 5 }
];

/**
 * Get all categories
 */
async function getCategories(req, res, next) {
  try {
    if (isMssqlConnected()) {
      const sqlQuery = `
        SELECT 
          c.id, 
          c.name, 
          c.slug, 
          c.description, 
          c.image_url AS image, 
          c.icon,
          c.is_active AS isActive,
          COUNT(p.id) AS productCount
        FROM Categories c
        LEFT JOIN Products p ON p.category_id = c.id AND p.is_active = 1
        WHERE c.is_active = 1
        GROUP BY c.id, c.name, c.slug, c.description, c.image_url, c.icon, c.is_active
        ORDER BY c.name ASC
      `;
      const result = await query(sqlQuery);
      return res.json({
        success: true,
        count: result.recordset.length,
        categories: result.recordset
      });
    }

    return res.json({
      success: true,
      count: defaultCategories.length,
      categories: defaultCategories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new category
 */
async function createCategory(req, res, next) {
  try {
    const { name, slug, description, image, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isMssqlConnected()) {
      const result = await query(
        `INSERT INTO Categories (name, slug, description, image_url, icon, is_active)
         OUTPUT INSERTED.*
         VALUES (@name, @slug, @description, @image, @icon, 1)`,
        {
          name,
          slug: catSlug,
          description: description || null,
          image: image || null,
          icon: icon || 'fa-tag'
        }
      );

      const newCategory = result.recordset[0];
      if (req.logAudit) {
        req.logAudit('CREATE_CATEGORY', 'Category', newCategory.id, { name, slug: catSlug });
      }

      return res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        category: newCategory
      });
    }

    const newCategory = {
      id: Date.now(),
      name,
      slug: catSlug,
      description,
      image,
      icon: icon || 'fa-tag',
      productCount: 0
    };
    defaultCategories.push(newCategory);

    return res.status(201).json({
      success: true,
      message: 'Category created (memory mode).',
      category: newCategory
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update category
 */
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, description, image, icon, isActive } = req.body;

    if (isMssqlConnected()) {
      const result = await query(
        `UPDATE Categories 
         SET name = COALESCE(@name, name),
             slug = COALESCE(@slug, slug),
             description = COALESCE(@description, description),
             image_url = COALESCE(@image, image_url),
             icon = COALESCE(@icon, icon),
             is_active = COALESCE(@isActive, is_active)
         OUTPUT INSERTED.*
         WHERE id = @id`,
        {
          id,
          name: name || null,
          slug: slug || null,
          description: description || null,
          image: image || null,
          icon: icon || null,
          isActive: isActive !== undefined ? (isActive ? 1 : 0) : null
        }
      );

      if (!result.recordset || result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found.' });
      }

      if (req.logAudit) {
        req.logAudit('UPDATE_CATEGORY', 'Category', id, req.body);
      }

      return res.json({
        success: true,
        message: 'Category updated successfully.',
        category: result.recordset[0]
      });
    }

    return res.json({
      success: true,
      message: 'Category updated (memory mode).'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete category
 */
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    if (isMssqlConnected()) {
      // Soft delete
      await query(
        `UPDATE Categories SET is_active = 0 WHERE id = @id`,
        { id }
      );

      if (req.logAudit) {
        req.logAudit('DELETE_CATEGORY', 'Category', id, {});
      }

      return res.json({
        success: true,
        message: 'Category deactivated successfully.'
      });
    }

    return res.json({
      success: true,
      message: 'Category deleted (memory mode).'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
