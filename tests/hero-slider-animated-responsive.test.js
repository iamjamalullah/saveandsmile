import test from 'node:test'
import assert from 'node:assert/strict'
import { getResolvedSlideData } from '../src/utils/heroSlideData.js'

test('Hero Slider - Default fallback & backward compatibility for legacy slides', () => {
  const legacySlide = {
    id: 101,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80',
    alt: 'Premium Audio & Smart Accessories',
    link: '/shop',
    title: 'Top Tier Audio',
    subtitle: 'Crisp sound for everyone',
  }

  const resolved = getResolvedSlideData(legacySlide)

  assert.equal(resolved.title, 'Top Tier Audio')
  assert.equal(resolved.subtitle, 'Crisp sound for everyone')
  assert.equal(resolved.images.desktop, legacySlide.image)
  assert.equal(resolved.images.mobile, '')
  assert.equal(resolved.primaryCta.text, 'Shop Now')
  assert.equal(resolved.primaryCta.link, '/shop')
  assert.equal(resolved.primaryCta.show, true)
  assert.equal(resolved.animation.desktop, 'fade-up')
  assert.equal(resolved.animation.bgZoom, true)
  assert.equal(resolved.responsive.desktop.headingSize, 42)
  assert.equal(resolved.responsive.tablet.headingSize, 32)
  assert.equal(resolved.responsive.mobile.headingSize, 22)
  assert.equal(resolved.responsive.mobile.layout, 'overlay')
})

test('Hero Slider - Rich slide data preservation & device independence', () => {
  const richSlide = {
    id: 202,
    image: 'https://cdn.saveandsmile.com/desktop.webp',
    tabletImage: 'https://cdn.saveandsmile.com/tablet.webp',
    mobileImage: 'https://cdn.saveandsmile.com/mobile.webp',
    slideData: {
      label: 'NEW 2026 COLLECTION',
      title: 'Make Your Home Smarter',
      subtitle: 'Discover innovative products that make everyday living easier.',
      primaryCta: {
        show: true,
        text: 'SHOP SMART NOW',
        link: '/catalog',
        style: 'filled',
      },
      secondaryCta: {
        show: true,
        text: 'EXPLORE ALL',
        link: '/categories',
        style: 'outline',
      },
      images: {
        desktop: 'https://cdn.saveandsmile.com/desktop.webp',
        tablet: 'https://cdn.saveandsmile.com/tablet.webp',
        mobile: 'https://cdn.saveandsmile.com/mobile.webp',
      },
      overlay: {
        enabled: true,
        type: 'dark',
        opacity: 0.45,
      },
      animation: {
        desktop: 'slide-left',
        tablet: 'fade-in',
        mobile: 'zoom-in',
        bgZoom: true,
        duration: 6000,
      },
      responsive: {
        desktop: {
          headingSize: 52,
          alignment: 'left',
          verticalPos: 'center',
          layout: 'overlay',
        },
        tablet: {
          headingSize: 36,
          alignment: 'center',
          verticalPos: 'center',
          layout: 'overlay',
        },
        mobile: {
          headingSize: 22,
          alignment: 'center',
          verticalPos: 'bottom',
          layout: 'below',
        },
      },
    },
  }

  const resolved = getResolvedSlideData(richSlide)

  assert.equal(resolved.label, 'NEW 2026 COLLECTION')
  assert.equal(resolved.title, 'Make Your Home Smarter')
  assert.equal(resolved.primaryCta.text, 'SHOP SMART NOW')
  assert.equal(resolved.secondaryCta.text, 'EXPLORE ALL')
  assert.equal(resolved.images.mobile, 'https://cdn.saveandsmile.com/mobile.webp')
  assert.equal(resolved.animation.desktop, 'slide-left')
  assert.equal(resolved.animation.tablet, 'fade-in')
  assert.equal(resolved.animation.mobile, 'zoom-in')
  assert.equal(resolved.animation.bgZoom, true)
  assert.equal(resolved.animation.duration, 6000)
  assert.equal(resolved.responsive.mobile.layout, 'below')
  assert.equal(resolved.responsive.mobile.headingSize, 22)
  assert.equal(resolved.responsive.desktop.headingSize, 52)
})
