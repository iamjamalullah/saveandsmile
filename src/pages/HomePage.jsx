import { useNavigate } from 'react-router'
import { useStoreData } from '../context/StoreDataContext'
import DynamicHomeSection from '../components/HomeCustomSections'
import Hero from '../components/Hero'
import { CategoryCirclesSection, TrustBarSection } from '../components/CategoryStrip'
import WatchAndShop from '../components/WatchAndShop'
import Reviews from '../components/Reviews'
import CategoryTabs from '../components/CategoryTabs'

export default function HomePage() {
  const navigate = useNavigate()
  const { categories = [], sections = [], loading } = useStoreData()

  const shopCategory = name => {
    const cat = categories.find(c => c.name === name)
    navigate(cat ? '/category/' + cat.slug : '/shop')
  }

  const displaySections = [...sections]
    .filter(s => s.enabled !== false && s.isVisible !== false)
    .sort((a, b) => (Number(a.order) || Number(a.id) || 0) - (Number(b.order) || Number(b.id) || 0))

  // Defense-in-depth fallback detection in case of legacy sections without new block types
  const hasRegisteredHero = sections.some(s => s.blockType === 'hero' || s.blockType === 'hero_slider')
  const hasRegisteredCategories = sections.some(s => s.blockType === 'categories')
  const hasRegisteredTrustBar = sections.some(s => s.blockType === 'trust_bar' || s.blockType === 'benefits')
  const hasRegisteredReels = sections.some(s => s.blockType === 'reels' || s.blockType === 'watch_and_shop')
  const hasRegisteredReviews = sections.some(s => s.blockType === 'reviews')
  const hasRegisteredCategoryTabs = sections.some(s => s.blockType === 'category_tabs')

  return (
    <main>
      {/* Fallback Hero if not registered in sections */}
      {!hasRegisteredHero && <Hero />}

      {/* Fallback Category Strip if not registered in sections */}
      {!hasRegisteredCategories && <CategoryCirclesSection onShopCategory={shopCategory} />}
      {!hasRegisteredTrustBar && <TrustBarSection />}

      {loading && !displaySections.length && (
        <div className="qg-container qg-home-loading" aria-live="polite">
          <span /> <span /> <span />
          <p>Loading wholesale catalogue…</p>
        </div>
      )}

      {/* All Dynamic Homepage Builder Sections (Sections #1 to #15) */}
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

      {/* Fallback bottom sections if not registered in sections */}
      {!hasRegisteredReels && <WatchAndShop onShopAll={() => navigate('/shop')} />}
      {!hasRegisteredReviews && <Reviews />}
      {!hasRegisteredCategoryTabs && <CategoryTabs onShopAll={() => navigate('/shop')} />}
    </main>
  )
}
