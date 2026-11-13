/**
 * SEO & Structured Data Utility for Save & Smile
 * Manages Dynamic Document Titles, Meta Descriptions, Canonical Tags, OpenGraph, Twitter Cards, and Schema.org JSON-LD
 */

const BASE_URL = 'https://saveandsmile.vercel.app'
const DEFAULT_IMAGE = `${BASE_URL}/LOGO001.png`
const SITE_NAME = 'Save & Smile'

export function setPageSeo({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  noindex = false,
  structuredData = null,
}) {
  if (typeof document === 'undefined') return

  // 1. Document Title
  const fullTitle = title ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`) : `${SITE_NAME} | Pakistan's Leading Online Shopping Hub`
  document.title = fullTitle

  // 2. Meta Description
  const metaDesc = description || 'Shop quality electronics, home essentials, organizers, fashion bags, fragrances, watches, and smart gadgets at unbeatable wholesale prices across Pakistan with cash on delivery.'
  let descTag = document.querySelector('meta[name="description"]')
  if (!descTag) {
    descTag = document.createElement('meta')
    descTag.name = 'description'
    document.head.appendChild(descTag)
  }
  descTag.content = metaDesc

  // 3. Robots / Noindex Directive
  let robotsTag = document.querySelector('meta[name="robots"]')
  if (noindex) {
    if (!robotsTag) {
      robotsTag = document.createElement('meta')
      robotsTag.name = 'robots'
      document.head.appendChild(robotsTag)
    }
    robotsTag.content = 'noindex, nofollow'
  } else if (robotsTag) {
    robotsTag.content = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
  }

  // 4. Canonical Tag
  const canonicalUrl = canonical ? (canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`) : `${BASE_URL}${window.location.pathname}`
  let canonLink = document.querySelector('link[rel="canonical"]')
  if (!canonLink) {
    canonLink = document.createElement('link')
    canonLink.rel = 'canonical'
    document.head.appendChild(canonLink)
  }
  canonLink.href = canonicalUrl.split('?')[0] // Clean canonical without tracking query params

  // 5. OpenGraph
  const setOg = (property, content) => {
    let tag = document.querySelector(`meta[property="${property}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('property', property)
      document.head.appendChild(tag)
    }
    tag.content = content
  }

  setOg('og:site_name', SITE_NAME)
  setOg('og:title', fullTitle)
  setOg('og:description', metaDesc)
  setOg('og:type', ogType)
  setOg('og:url', canonicalUrl)
  setOg('og:image', ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`)

  // 6. Twitter Card
  const setTwitter = (name, content) => {
    let tag = document.querySelector(`meta[name="${name}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.name = name
      document.head.appendChild(tag)
    }
    tag.content = content
  }

  setTwitter('twitter:card', 'summary_large_image')
  setTwitter('twitter:title', fullTitle)
  setTwitter('twitter:description', metaDesc)
  setTwitter('twitter:image', ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`)

  // 7. Structured Data (JSON-LD)
  const SCRIPT_ID = 'saveandsmile-structured-data'
  let scriptTag = document.getElementById(SCRIPT_ID)

  if (structuredData) {
    if (!scriptTag) {
      scriptTag = document.createElement('script')
      scriptTag.id = SCRIPT_ID
      scriptTag.type = 'application/ld+json'
      document.head.appendChild(scriptTag)
    }
    scriptTag.textContent = JSON.stringify(structuredData)
  } else if (scriptTag) {
    scriptTag.remove()
  }
}
