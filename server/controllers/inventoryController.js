const { query, isMssqlConnected } = require('../config/mssql');

/**
 * Get stock inventory overview
 */
async function getInventoryStatus(req, res, next) {
  try {
    if (isMssqlConnected()) {
      const result = await query(`
        SELECT 
          p.id,
          p.sku,
          p.code,
          p.name,
          p.title,
          p.stock_quantity AS stock,
          p.price,
          c.name AS categoryName,
          CASE 
            WHEN p.stock_quantity <= 0 THEN 'OUT_OF_STOCK'
            WHEN p.stock_quantity <= 10 THEN 'LOW_STOCK'
            ELSE 'IN_STOCK'
          END AS stockStatus
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        ORDER BY p.stock_quantity ASC
      `);

      const lowStockCount = result.recordset.filter(p => p.stockStatus === 'LOW_STOCK').length;
      const outOfStockCount = result.recordset.filter(p => p.stockStatus === 'OUT_OF_STOCK').length;

      return res.json({
        success: true,
        summary: {
          totalProducts: result.recordset.length,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount
        },
        inventory: result.recordset
      });
    }

    return res.json({
      success: true,
      summary: { totalProducts: 0, lowStock: 0, outOfStock: 0 },
      inventory: []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Adjust stock level for a product
 */
async function adjustStock(req, res, next) {
  try {
    const { productId, quantity, movementType = 'ADJUSTMENT', reason = '', reference = '' } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity delta are required.' });
    }

    const qtyNum = parseInt(quantity, 10);

    if (isMssqlConnected()) {
      const updateResult = await query(
        `UPDATE Products 
         SET stock_quantity = CASE WHEN stock_quantity + @qty < 0 THEN 0 ELSE stock_quantity + @qty END
         OUTPUT INSERTED.id, INSERTED.name, INSERTED.sku, INSERTED.stock_quantity AS stock
         WHERE id = @id;

         INSERT INTO InventoryMovements (product_id, movement_type, quantity, reference, reason)
         VALUES (@id, @movementType, @qty, @reference, @reason);`,
        {
          id: productId,
          qty: qtyNum,
          movementType,
          reason,
          reference: reference || `Manual adjustment by ${req.user ? req.user.username : 'admin'}`
        }
      );

      if (req.logAudit) {
        req.logAudit('ADJUST_STOCK', 'Inventory', productId, { delta: qtyNum, movementType, reason });
      }

      return res.json({
        success: true,
        message: 'Stock adjusted successfully.',
        product: updateResult.recordset[0]
      });
    }

    return res.json({
      success: true,
      message: 'Stock adjusted (memory mode).'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get inventory audit movements ledger
 */
async function getMovements(req, res, next) {
  try {
    const { page = 1, limit = 50, productId } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    if (isMssqlConnected()) {
      let where = '';
      const params = { offset, limit: parseInt(limit, 10) };

      if (productId) {
        where = 'WHERE m.product_id = @productId';
        params.productId = productId;
      }

      const result = await query(
        `SELECT 
          m.id,
          m.product_id AS productId,
          p.name AS productName,
          p.sku,
          m.movement_type AS movementType,
          m.quantity,
          m.reference,
          m.reason,
          m.created_at AS createdAt
        FROM InventoryMovements m
        LEFT JOIN Products p ON p.id = m.product_id
        ${where}
        ORDER BY m.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        params
      );

      return res.json({
        success: true,
        movements: result.recordset
      });
    }

    return res.json({
      success: true,
      movements: []
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInventoryStatus,
  adjustStock,
  getMovements
};
