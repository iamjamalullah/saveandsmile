// Production REST client for the Save & Smile API with RBAC Bearer Token Authorization.
const BASE = import.meta.env?.VITE_API_URL || '/api'

let authToken = null
try {
  authToken = localStorage.getItem('qg_token')
} catch {}

export function setAuthToken(token) {
  authToken = token
  try {
    if (token) localStorage.setItem('qg_token', token)
    else localStorage.removeItem('qg_token')
  } catch {}
}

export function getAuthToken() {
  if (!authToken) {
    try {
      authToken = localStorage.getItem('qg_token')
    } catch {}
  }
  return authToken
}

async function request(path, { method = 'GET', body, signal, headers = {} } = {}) {
  const reqHeaders = { ...headers }
  if (body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json'
  }
  const token = getAuthToken()
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`
  }

  // 12-second timeout to prevent hung requests
  let timeoutId
  let controller
  if (!signal) {
    controller = new AbortController()
    signal = controller.signal
    timeoutId = setTimeout(() => controller.abort(), 12000)
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Store API request timed out. Please verify your connection.')
    }
    throw new Error('Could not reach the store API. Start it with “npm run api”.')
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }

  if (!res.ok) {
    let detail = ''
    try {
      const errJson = await res.json()
      detail = errJson?.error || errJson?.message || ''
    } catch {
      try { detail = (await res.text()).slice(0, 140) } catch {}
    }
    const error = new Error(detail || `API ${method} ${path} failed with status ${res.status}`)
    error.status = res.status
    error.statusText = res.statusText
    throw error
  }

  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  list: (resource, query = '') => request(`/${resource}${query ? `?${query}` : ''}`),
  get: (resource, id) => request(`/${resource}/${encodeURIComponent(id)}`),
  create: (resource, body) => request(`/${resource}`, { method: 'POST', body }),
  patch: (resource, id, body) => request(`/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  replace: (resource, id, body) => request(`/${resource}/${encodeURIComponent(id)}`, { method: 'PUT', body }),
  remove: (resource, id) => request(`/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
    changePassword: (oldPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } }),
  },

  homepage: {
    getPublished: () => request('/homepage/sections'),
    getDraft: () => request('/homepage/draft'),
    saveDraft: (sections) => request('/homepage/draft', { method: 'POST', body: { sections } }),
    publish: (sections, label) => request('/homepage/publish', { method: 'POST', body: { sections, label } }),
    getVersions: () => request('/homepage/versions'),
    restoreVersion: (versionId) => request('/homepage/restore-version', { method: 'POST', body: { versionId } }),
  },
}
