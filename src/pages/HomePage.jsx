import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useStoreData } from '../context/StoreDataContext'
import DynamicHomeSection from '../components/HomeCustomSections'
import Hero from '../components/Hero'
import { CategoryCirclesSection, TrustBarSection } from '../components/CategoryStrip'
import WatchAndShop from '../components/WatchAndShop'
import Reviews from '../components/Reviews'
import CategoryTabs from '../components/CategoryTabs'
import { setPageSeo } from '../utils/seo'

export default function HomePage() {
  const navigate = useNavigate()
  const { categories = [], sections = [], loading } = useStoreData()

  useEffect(() => {
    setPageSeo({
      title: "Save & Smile | Pakistan's Leading Online Wholesaler & Retail Store",
      description: "Shop quality electronics, home organizers, kitchenware, fragrances, watches, beauty essentials and wholesale accessories at unbeatable prices across Pakistan with fast cash on delivery.",
      canonical: '/',
      ogType: 'website',
      structuredData: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://saveandsmile.vercel.app/#organization',
            name: 'Save & Smile',
            url: 'https://saveandsmile.vercel.app',
            logo: {
              '@type': 'ImageObject',
              url: 'https://saveandsmile.vercel.app/LOGO001.png',
              width: 512,
              height: 512,
            },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+923337221552',
              contactType: 'customer service',
              areaServed: 'PK',
              availableLanguage: ['en', 'ur'],
            },
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Karachi',
              addressCountry: 'PK',
            },
          },
          {
            '@type': 'WebSite',
            '@id': 'https://saveandsmile.vercel.app/#website',
            url: 'https://saveandsmile.vercel.app',
            name: 'Save & Smile',
            publisher: { '@id': 'https://saveandsmile.vercel.app/#organization' },
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://saveandsmile.vercel.app/shop?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      },
    })
  }, [])

  const shopCategory = name => {
    const cat = categories.find(c => c.name === name)
    navigate(cat ? '/category/' + cat.slug : '/shop')
  }

  // Authoritative Single Source of Truth: only published, enabled, visible sections
  const displaySections = [...sections]
    .filter(s => s.enabled !== false && s.isVisible !== false)
    .sort((a, b) => (Number(a.order) || Number(a.id) || 0) - (Number(b.order) || Number(b.id) || 0))

  // True catastrophic fallback ONLY if sections array failed to load from API/DB completely
  const isCompletelyEmptyConfig = !loading && sections.length === 0

  return (
    <main>
      {loading && !displaySections.length && (
        <div className="qg-container qg-home-loading" aria-live="polite">
          <span /> <span /> <span />
          <p>Loading wholesale catalogue…</p>
        </div>
      )}

      {/* Catastrophic cold-start fallback only when DB/API returned zero sections */}
      {isCompletelyEmptyConfig && (
        <>
          <Hero />
          <CategoryCirclesSection onShopCategory={shopCategory} />
          <TrustBarSection />
          <WatchAndShop onShopAll={() => navigate('/shop')} />
          <Reviews />
          <CategoryTabs onShopAll={() => navigate('/shop')} />
        </>
      )}

      {/* All Dynamic Homepage Builder Sections (Strict Single Source of Truth) */}
      {displaySections.map((s, idx) => (
        <div key={s.id || s.group || idx}>
          <DynamicHomeSection
            section={s}
            onShopCategory={shopCategory}
            onViewAll={group => navigate(s.category ? ('/category/' + s.category) : (group ? ('/shop?group=' + group) : (s.group ? ('/shop?group=' + s.group) : '/shop')))}
            onSeeMore={() => navigate(s.category ? ('/category/' + s.category) : (s.group ? ('/shop?group=' + s.group) : '/shop'))}
          />
        </div>
      ))}
    </main>
  )
}
