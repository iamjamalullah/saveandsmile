import { useNavigate } from 'react-router'
import { useStoreData } from '../context/StoreDataContext'
import Hero from '../components/Hero'
import CategoryStrip from '../components/CategoryStrip'
import DynamicHomeSection from '../components/HomeCustomSections'
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
    .filter(s => s.enabled !== false)
    .sort((a, b) => (Number(a.order) || Number(a.id) || 0) - (Number(b.order) || Number(b.id) || 0))

  const hasCategoriesSection = displaySections.some(s => s.blockType === 'categories')
  const hasReelsSection = displaySections.some(s => s.blockType === 'reels' || s.blockType === 'watch_and_shop')
  const hasReviewsSection = displaySections.some(s => s.blockType === 'reviews')
  const hasCategoryTabsSection = displaySections.some(s => s.blockType === 'category_tabs')

  return (
    <main>
      <Hero />
      {!hasCategoriesSection && <CategoryStrip onShopCategory={shopCategory} />}

      {loading && !displaySections.length && (
        <div className="qg-container qg-home-loading" aria-live="polite">
          <span /> <span /> <span />
          <p>Loading wholesale catalogue…</p>
        </div>
      )}

      {displaySections.map((s, idx) => (
        <div key={s.id || s.group || idx}>
          <DynamicHomeSection
            section={s}
            onViewAll={() => navigate(s.category ? ('/category/' + s.category) : (s.group ? ('/shop?group=' + s.group) : '/shop'))}
            onSeeMore={() => navigate(s.category ? ('/category/' + s.category) : (s.group ? ('/shop?group=' + s.group) : '/shop'))}
          />
        </div>
      ))}

      {!hasReelsSection && <WatchAndShop onShopAll={() => navigate('/shop')} />}
      {!hasReviewsSection && <Reviews />}
      {!hasCategoryTabsSection && <CategoryTabs onShopAll={() => navigate('/shop')} />}
    </main>
  )
}
