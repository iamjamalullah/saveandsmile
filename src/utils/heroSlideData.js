/**
 * Normalizes slide record to full rich enterprise settings.
 * Ensures 100% backward compatibility with legacy string-only slides.
 */
export function getResolvedSlideData(s = {}) {
  const d = s.slideData || {}
  const title = d.title !== undefined ? d.title : (s.title || '')
  const subtitle = d.subtitle !== undefined ? d.subtitle : (s.subtitle || '')
  const link = s.link || d.primaryCta?.link || '/shop'
  const primaryText = d.primaryCta?.text || (title ? 'Shop Now' : '')

  return {
    label: d.label || '',
    title,
    subtitle,
    primaryCta: {
      text: primaryText,
      link,
      show: Boolean(d.primaryCta?.show ?? (primaryText || title)),
      style: d.primaryCta?.style || 'filled', // 'filled' | 'outline' | 'glass'
      size: d.primaryCta?.size || 'md',
    },
    secondaryCta: {
      text: d.secondaryCta?.text || '',
      link: d.secondaryCta?.link || '/shop',
      show: Boolean(d.secondaryCta?.show && d.secondaryCta?.text),
      style: d.secondaryCta?.style || 'outline',
      size: d.secondaryCta?.size || 'md',
    },
    images: {
      desktop: s.image || d.images?.desktop || '',
      tablet: s.tabletImage || d.images?.tablet || '',
      mobile: s.mobileImage || d.images?.mobile || '',
    },
    overlay: {
      enabled: Boolean(d.overlay?.enabled ?? Boolean(title || subtitle)),
      type: d.overlay?.type || 'gradient', // 'none' | 'dark' | 'light' | 'gradient' | 'custom'
      opacity: typeof d.overlay?.opacity === 'number' ? d.overlay.opacity : 0.45,
      direction: d.overlay?.direction || 'to-right', // 'to-right' | 'to-left' | 'to-top' | 'to-bottom'
      color: d.overlay?.color || '#000000',
    },
    animation: {
      desktop: d.animation?.desktop || 'fade-up', // 'fade-up' | 'slide-left' | 'slide-right' | 'fade-in' | 'zoom-in' | 'none'
      tablet: d.animation?.tablet || 'fade-up',
      mobile: d.animation?.mobile || 'fade-up',
      bgZoom: Boolean(d.animation?.bgZoom ?? true),
      duration: Number(d.animation?.duration) || 5200,
    },
    responsive: {
      desktop: {
        alignment: d.responsive?.desktop?.alignment || 'left', // 'left' | 'center' | 'right'
        verticalPos: d.responsive?.desktop?.verticalPos || 'center', // 'top' | 'center' | 'bottom'
        headingSize: d.responsive?.desktop?.headingSize || 42,
        subheadingSize: d.responsive?.desktop?.subheadingSize || 17,
        labelSize: d.responsive?.desktop?.labelSize || 13,
        maxWidth: d.responsive?.desktop?.maxWidth || 620,
        textColor: d.responsive?.desktop?.textColor || '#ffffff',
        hideSubheading: Boolean(d.responsive?.desktop?.hideSubheading),
        hideLabel: Boolean(d.responsive?.desktop?.hideLabel),
        layout: 'overlay',
      },
      tablet: {
        alignment: d.responsive?.tablet?.alignment || 'left',
        verticalPos: d.responsive?.tablet?.verticalPos || 'center',
        headingSize: d.responsive?.tablet?.headingSize || 32,
        subheadingSize: d.responsive?.tablet?.subheadingSize || 15,
        labelSize: d.responsive?.tablet?.labelSize || 12,
        maxWidth: d.responsive?.tablet?.maxWidth || 480,
        textColor: d.responsive?.tablet?.textColor || '#ffffff',
        hideSubheading: Boolean(d.responsive?.tablet?.hideSubheading),
        hideLabel: Boolean(d.responsive?.tablet?.hideLabel),
        layout: 'overlay',
      },
      mobile: {
        alignment: d.responsive?.mobile?.alignment || 'center',
        verticalPos: d.responsive?.mobile?.verticalPos || 'center',
        headingSize: d.responsive?.mobile?.headingSize || 22,
        subheadingSize: d.responsive?.mobile?.subheadingSize || 13.5,
        labelSize: d.responsive?.mobile?.labelSize || 11,
        maxWidth: d.responsive?.mobile?.maxWidth || 100,
        textColor: d.responsive?.mobile?.textColor || '#ffffff',
        hideSubheading: Boolean(d.responsive?.mobile?.hideSubheading),
        hideLabel: Boolean(d.responsive?.mobile?.hideLabel),
        layout: d.responsive?.mobile?.layout || 'overlay', // 'overlay' | 'above' | 'below' | 'stacked'
      },
    },
  }
}
