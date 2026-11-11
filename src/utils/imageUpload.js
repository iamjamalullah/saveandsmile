/**
 * Automatic Client-Side WebP Converter & Multi-Image Uploader
 * Qadri Gadgets E-Commerce Architecture
 */

/**
 * Converts any image file (PNG, JPG, BMP, etc.) into an optimized WebP format
 * using HTML5 Canvas with proportional dimension scaling and quality compression.
 *
 * @param {File} file - Browser File object
 * @param {number} maxWidth - Maximum image width in pixels (default: 1600)
 * @param {number} quality - WebP compression quality between 0.1 and 1.0 (default: 0.85)
 * @returns {Promise<{ name: string, dataUrl: string, originalSize: number, webpSize: number, width: number, height: number }>}
 */
export async function convertFileToWebp(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    // Validate that the file is an image
    if (!file.type.startsWith('image/')) {
      return reject(new Error(`File "${file.name}" is not a valid image file.`))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}".`))
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onerror = () => reject(new Error(`Failed to decode image "${file.name}".`))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Downscale proportionally if larger than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Force conversion to image/webp format
        const webpDataUrl = canvas.toDataURL('image/webp', quality)

        // Calculate approximate size in bytes from base64
        const base64Length = webpDataUrl.length - (webpDataUrl.indexOf(',') + 1)
        const webpSize = Math.round((base64Length * 3) / 4)

        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')
        const webpName = `${baseName}.webp`

        resolve({
          name: webpName,
          dataUrl: webpDataUrl,
          originalSize: file.size,
          webpSize,
          width,
          height,
        })
      }
      img.src = readerEvent.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads an array of converted WebP images to the backend server.
 *
 * @param {Array<{ name: string, dataUrl: string }>} webpImages
 * @returns {Promise<string[]>} Array of saved URLs (e.g. ['/uploads/products/prod_123.webp'])
 */
export async function uploadWebpImages(webpImages) {
  if (!webpImages || !webpImages.length) return []

  const payload = {
    images: webpImages.map(img => ({
      name: img.name,
      data: img.dataUrl,
    })),
  }

  // Use proxy path /api/upload or direct /upload
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Upload failed with HTTP status ${response.status}`)
  }

  const result = await response.json()
  return result.urls || []
}
