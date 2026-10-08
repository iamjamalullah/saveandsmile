const ROLES = [
  'super_admin',
  'admin',
  'manager',
  'editor',
  'inventory_manager',
  'order_manager',
  'content_manager',
  'marketing_manager'
];

const PERMS = {
  dashboard: { view: ['*'] },
  products: { view: ['*'], create: ['super_admin', 'admin', 'manager', 'editor'], edit: ['super_admin', 'admin', 'manager', 'editor'], delete: ['super_admin', 'admin'], publish: ['super_admin', 'admin', 'manager'] },
  categories: { view: ['*'], create: ['super_admin', 'admin', 'manager', 'editor'], edit: ['super_admin', 'admin', 'manager', 'editor'], delete: ['super_admin', 'admin'] },
  collections: { view: ['*'], create: ['super_admin', 'admin', 'manager', 'editor'], edit: ['super_admin', 'admin', 'manager', 'editor'], delete: ['super_admin', 'admin'] },
  brands: { view: ['*'], create: ['super_admin', 'admin', 'manager', 'editor'], edit: ['super_admin', 'admin', 'manager', 'editor'], delete: ['super_admin', 'admin'] },
  inventory: { view: ['*', 'inventory_manager'], adjust: ['super_admin', 'admin', 'inventory_manager', 'manager'] },
  orders: { view: ['*', 'order_manager'], edit: ['super_admin', 'admin', 'order_manager', 'manager'] },
  customers: { view: ['*'], edit: ['super_admin', 'admin', 'manager', 'order_manager'] },
  media: { view: ['*'], create: ['*'], edit: ['*'], delete: ['super_admin', 'admin', 'content_manager', 'manager'] },
  pages: { view: ['*', 'content_manager'], edit: ['super_admin', 'admin', 'content_manager', 'manager'], publish: ['super_admin', 'admin', 'content_manager'] },
  banners: { view: ['*', 'content_manager', 'marketing_manager'], edit: ['super_admin', 'admin', 'content_manager', 'marketing_manager', 'manager'] },
  reviews: { view: ['*'], edit: ['super_admin', 'admin', 'content_manager', 'manager'] },
  coupons: { view: ['*', 'marketing_manager'], edit: ['super_admin', 'admin', 'marketing_manager', 'manager'] },
  seo: { view: ['*'], edit: ['super_admin', 'admin', 'content_manager', 'manager'] },
  settings: { view: ['super_admin', 'admin'], edit: ['super_admin', 'admin'] },
  users: { view: ['super_admin', 'admin'], edit: ['super_admin', 'admin'] },
  shipping: { view: ['super_admin', 'admin', 'manager'], edit: ['super_admin', 'admin'] },
  forms: { view: ['*'], edit: ['super_admin', 'admin', 'content_manager', 'marketing_manager'] },
  popups: { view: ['*', 'marketing_manager'], edit: ['super_admin', 'admin', 'marketing_manager', 'content_manager'] }
};

function can(role, resource, action) {
  if (!role) return false;
  const spec = PERMS[resource];
  if (!spec) return role === 'super_admin' || role === 'admin';
  const allowed = spec[action] || spec.view || [];
  if (allowed.includes('*')) {
    if (action === 'view') return true;
  }
  if (role === 'super_admin') return true;
  return allowed.includes('*') || allowed.includes(role);
}

function requirePerm(user, resource, action) {
  if (!user || !can(user.role, resource, action)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

module.exports = { ROLES, PERMS, can, requirePerm };
