const fs = require('fs');
const path = require('path');
const { setCorsHeaders } = require('./cors');
const { logAudit, getAuditLogs } = require('./audit');
const { getSetting, saveSetting } = require('./db');

const DATA_DIR = path.join(process.cwd(), 'data');
const PAGES_FILE = path.join(DATA_DIR, 'content_pages.json');
const BRANDS_FILE = path.join(DATA_DIR, 'brands_attributes.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff_members.json');
const NOT_FOUND_FILE = path.join(DATA_DIR, '404_logs.json');
const REDIRECTS_FILE = path.join(DATA_DIR, 'seo_redirects.json');

function readJson(file, fallback = []) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}
  return fallback;
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to write file:', file, e.message);
  }
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const type = (req.query && req.query.type) || 'pages';

  // 1. CONTENT PAGES
  if (type === 'pages') {
    if (req.method === 'GET') {
      const pages = (await getSetting('content_pages', null)) || readJson(PAGES_FILE, []);
      return res.status(200).json({ success: true, count: pages.length, pages });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);

        let pages = (await getSetting('content_pages', null)) || readJson(PAGES_FILE, []);
        const pageId = body.id || `page_${Date.now()}`;
        const existingIdx = pages.findIndex(p => p.id === pageId || p.slug === body.slug);

        const newPage = {
          id: pageId,
          title: body.title || 'Untitled Page',
          slug: body.slug ? body.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-') : 'new-page',
          isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
          publishedAt: body.publishedAt || new Date().toISOString(),
          excerpt: body.excerpt || '',
          content: body.content || '',
          seoTitle: body.seoTitle || body.title || '',
          seoDescription: body.seoDescription || body.excerpt || '',
          focusKeyword: body.focusKeyword || '',
          canonicalUrl: body.canonicalUrl || `https://saveandsmile.pk/${body.slug || 'page'}`
        };

        if (existingIdx >= 0) {
          pages[existingIdx] = { ...pages[existingIdx], ...newPage };
        } else {
          pages.push(newPage);
        }

        await saveSetting('content_pages', pages);
        writeJson(PAGES_FILE, pages);
        logAudit({ action: existingIdx >= 0 ? 'PAGE_UPDATED' : 'PAGE_CREATED', entity: 'Content Page', entityId: newPage.slug, details: `Saved page: ${newPage.title}` });
        return res.status(200).json({ success: true, page: newPage });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);
        const id = (body && body.id) || (req.query && req.query.id);
        let pages = (await getSetting('content_pages', null)) || readJson(PAGES_FILE, []);
        pages = pages.filter(p => p.id !== id && p.slug !== id);
        await saveSetting('content_pages', pages);
        writeJson(PAGES_FILE, pages);
        logAudit({ action: 'PAGE_DELETED', entity: 'Content Page', entityId: id, details: `Deleted page ID: ${id}` });
        return res.status(200).json({ success: true, message: 'Page deleted successfully' });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  // 2. BRANDS, ATTRIBUTES & TAGS
  if (type === 'brands' || type === 'attributes') {
    let data = (await getSetting('brands_attributes', null)) || readJson(BRANDS_FILE, { brands: [], attributes: [], tags: [] });

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);

        const subType = body.subType || 'brand'; // 'brand', 'attribute', 'tag'

        if (subType === 'brand') {
          const brand = {
            id: body.id || `b_${Date.now()}`,
            name: body.name || 'New Brand',
            slug: body.slug || (body.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
            description: body.description || '',
            productCount: parseInt(body.productCount, 10) || 0,
            logo: body.logo || ''
          };
          const bIdx = data.brands.findIndex(b => b.id === brand.id);
          if (bIdx >= 0) data.brands[bIdx] = brand;
          else data.brands.push(brand);
        } else if (subType === 'attribute') {
          const attr = {
            id: body.id || `attr_${Date.now()}`,
            name: body.name || 'Attribute',
            code: body.code || (body.name || '').toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
            terms: Array.isArray(body.terms) ? body.terms : (body.terms || '').split(',').map((t) => t.trim()).filter(Boolean)
          };
          const aIdx = data.attributes.findIndex(a => a.id === attr.id);
          if (aIdx >= 0) data.attributes[aIdx] = attr;
          else data.attributes.push(attr);
        } else if (subType === 'tag') {
          const newTag = (body.tag || '').trim().toLowerCase();
          if (newTag && !data.tags.includes(newTag)) {
            data.tags.push(newTag);
          }
        }

        await saveSetting('brands_attributes', data);
        writeJson(BRANDS_FILE, data);
        logAudit({ action: 'CATALOG_METADATA_UPDATED', entity: 'Brands & Attributes', entityId: subType, details: `Updated ${subType}` });
        return res.status(200).json({ success: true, data });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);
        const { subType, id, tag } = body;
        if (subType === 'brand') {
          data.brands = data.brands.filter(b => b.id !== id);
        } else if (subType === 'attribute') {
          data.attributes = data.attributes.filter(a => a.id !== id);
        } else if (subType === 'tag' && tag) {
          data.tags = data.tags.filter(t => t !== tag);
        }
        await saveSetting('brands_attributes', data);
        writeJson(BRANDS_FILE, data);
        return res.status(200).json({ success: true, data });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  // 3. STAFF MEMBERS
  if (type === 'staff') {
    let staff = (await getSetting('staff_members', null)) || readJson(STAFF_FILE, []);

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, count: staff.length, staff });
    }

    if (req.method === 'POST') {
      try {
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);

        const newStaff = {
          id: body.id || `staff_${Date.now()}`,
          name: body.name || 'Staff Member',
          email: body.email || '',
          role: body.role || 'Store Administrator',
          permissions: Array.isArray(body.permissions) ? body.permissions : ['orders', 'products'],
          phone: body.phone || '',
          status: body.status || 'active',
          lastLogin: new Date().toISOString()
        };

        const existingIdx = staff.findIndex(s => s.id === newStaff.id || s.email === newStaff.email);
        if (existingIdx >= 0) staff[existingIdx] = newStaff;
        else staff.push(newStaff);

        await saveSetting('staff_members', staff);
        writeJson(STAFF_FILE, staff);
        logAudit({ action: 'STAFF_MEMBER_SAVED', entity: 'Staff', entityId: newStaff.email, details: `Saved staff ${newStaff.name} (${newStaff.role})` });
        return res.status(200).json({ success: true, staff: newStaff });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);
        const id = body.id || req.query.id;
        staff = staff.filter(s => s.id !== id && s.email !== id);
        await saveSetting('staff_members', staff);
        writeJson(STAFF_FILE, staff);
        return res.status(200).json({ success: true, message: 'Staff member removed' });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  // 4. AUDIT LOGS
  if (type === 'audit') {
    const logs = getAuditLogs(200);
    return res.status(200).json({ success: true, count: logs.length, logs });
  }

  // 5. 404 MONITOR
  if (type === '404') {
    let logs404 = readJson(NOT_FOUND_FILE, []);

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, count: logs404.length, logs: logs404 });
    }

    if (req.method === 'POST') {
      try {
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);

        const { path: reqPath, redirectTarget } = body;

        // If creating redirect from 404
        if (reqPath && redirectTarget) {
          const redirects = readJson(REDIRECTS_FILE, []);
          redirects.unshift({
            id: 'red_' + Date.now(),
            source_url: reqPath,
            target_url: redirectTarget,
            redirect_type: 301,
            is_active: true,
            hits_count: 0,
            created_at: new Date().toISOString()
          });
          writeJson(REDIRECTS_FILE, redirects);

          // Mark resolved in 404 log
          const entry = logs404.find(l => l.path === reqPath);
          if (entry) entry.resolvedRedirect = redirectTarget;
          writeJson(NOT_FOUND_FILE, logs404);

          logAudit({ action: 'REDIRECT_CREATED_FROM_404', entity: 'SEO Redirects', entityId: reqPath, details: `301 Redirect: ${reqPath} -> ${redirectTarget}` });
          return res.status(200).json({ success: true, message: 'Redirect created and 404 resolved' });
        }

        // Otherwise log a new 404
        const existing = logs404.find(l => l.path === reqPath);
        if (existing) {
          existing.occurrences = (existing.occurrences || 1) + 1;
          existing.lastSeen = new Date().toISOString();
        } else {
          logs404.unshift({
            id: '404_' + Date.now(),
            path: reqPath,
            occurrences: 1,
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            referer: body.referer || 'Direct',
            userAgent: body.userAgent || 'Web Browser',
            resolvedRedirect: null
          });
        }
        writeJson(NOT_FOUND_FILE, logs404);
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
