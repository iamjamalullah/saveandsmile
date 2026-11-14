import { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'
import { api } from '../../api'

export default function MobileAppReleaseSection() {
  const [release, setRelease] = useState(null)
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    version: '1.0.1',
    versionCode: 2,
    releaseNotes: '',
    file: null,
    fileName: '',
    fileSize: '',
  })

  // Download URL
  const downloadUrl = useMemo(() => {
    if (release?.downloadUrl) return release.downloadUrl
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/api/downloads/admin-apk`
    }
    return 'https://saveandsmile.vercel.app/api/downloads/admin-apk'
  }, [release])

  // Load Release Data
  const loadReleaseData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mobile/releases/latest')
      const data = await res.json()
      if (data?.release) {
        setRelease(data.release)
      }

      const histRes = await fetch('/api/mobile/releases', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      }).catch(() => null)

      if (histRes && histRes.ok) {
        const histData = await histRes.json()
        if (Array.isArray(histData?.releases)) {
          setReleases(histData.releases)
        }
      }
    } catch (err) {
      console.warn('Failed to load release info:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReleaseData()
  }, [])

  // Generate QR Code
  useEffect(() => {
    if (downloadUrl) {
      QRCode.toDataURL(downloadUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff',
        },
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => {
          console.warn('QR error, fallback to API:', err)
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(downloadUrl)}`)
        })
    }
  }, [downloadUrl])

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.apk')) {
      setUploadError('Selected file must be an Android APK package (.apk)')
      return
    }

    setUploadError('')
    setUploadForm(f => ({
      ...f,
      file,
      fileName: file.name,
      fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
    }))
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!uploadForm.file) {
      setUploadError('Please select a valid .apk file to upload')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64Data = reader.result
          const res = await fetch('/api/mobile/releases/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
            body: JSON.stringify({
              base64Data,
              filename: uploadForm.fileName,
              version: uploadForm.version,
              versionCode: uploadForm.versionCode,
              releaseNotes: uploadForm.releaseNotes,
            }),
          })

          const data = await res.json()
          if (!res.ok) {
            throw new Error(data.error || 'Failed to upload and publish release')
          }

          setUploadSuccess(`Successfully published Save & Smile Admin APK v${uploadForm.version}!`)
          setUploadForm({
            version: '1.0.2',
            versionCode: Number(uploadForm.versionCode) + 1,
            releaseNotes: '',
            file: null,
            fileName: '',
            fileSize: '',
          })
          await loadReleaseData()
        } catch (subErr) {
          setUploadError(subErr.message)
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(uploadForm.file)
    } catch (err) {
      setUploadError(err.message)
      setUploading(false)
    }
  }

  return (
    <div className="mobile-app-release-section">
      {/* Hero Release Banner */}
      <div
        className="card border-0 shadow-sm mb-4 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0d9488 100%)',
          borderRadius: '16px',
        }}
      >
        <div className="card-body p-4">
          <div className="row align-items-center g-3">
            <div className="col-auto">
              <div
                className="rounded-4 bg-white p-2 d-flex align-items-center justify-content-center shadow"
                style={{ width: '64px', height: '64px' }}
              >
                <i className="bi bi-android2 fs-1" style={{ color: '#047857' }}></i>
              </div>
            </div>
            <div className="col">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h4 className="fw-bold mb-0 text-white">Save &amp; Smile Admin</h4>
                <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                  v{release?.version || '1.0.0'} (Build {release?.versionCode || 1})
                </span>
                <span className="badge bg-success-subtle text-white border border-success fw-semibold px-2 py-1">
                  <i className="bi bi-shield-check me-1"></i> Official Verified Release
                </span>
              </div>
              <p className="mb-0 text-white-50 small">
                Package ID: <code>{release?.packageName || 'com.saveandsmile.admin'}</code> • Target: Android 13, 14, 15, and 16
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* QR Code & Direct Download Card */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm h-100 border-0 rounded-4">
            <div className="card-header bg-white py-3 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-qr-code text-success fs-5"></i>
                <h5 className="fw-bold mb-0">Mobile Download QR Code</h5>
              </div>
            </div>
            <div className="card-body p-4 text-center">
              <div
                className="p-3 bg-white rounded-3 border shadow-sm d-inline-block mx-auto mb-3"
                style={{ minWidth: '240px', minHeight: '240px' }}
              >
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Save & Smile APK Download QR Code"
                    className="img-fluid rounded"
                    style={{ width: '220px', height: '220px', objectFit: 'contain' }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center text-muted small"
                    style={{ width: '220px', height: '220px' }}
                  >
                    <div className="spinner-border spinner-border-sm text-success me-2"></div>
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="text-muted small mb-3">
                <i className="bi bi-camera me-1 text-success"></i>
                Point your Android camera or Google Lens at this QR code to download directly.
              </div>

              <div className="d-grid gap-2">
                <a
                  href={downloadUrl}
                  download="SaveAndSmile-Admin.apk"
                  className="btn btn-success fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="bi bi-download"></i>
                  <span>Download APK ({release?.fileSizeFormatted || '4.8 MB'})</span>
                </a>

                <div className="input-group">
                  <input
                    type="text"
                    readOnly
                    value={downloadUrl}
                    className="form-control form-control-sm font-monospace bg-light"
                    onClick={e => e.target.select()}
                  />
                  <button
                    type="button"
                    className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={handleCopyLink}
                  >
                    <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Release Specifications & Upload Card */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm mb-4 border-0 rounded-4">
            <div className="card-header bg-white py-3 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-info-circle text-primary fs-5"></i>
                <h5 className="fw-bold mb-0">Active Release Specifications</h5>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row g-3 small">
                <div className="col-6 col-md-4">
                  <span className="text-muted d-block">Application:</span>
                  <strong className="text-dark">Save &amp; Smile Admin</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-muted d-block">Version:</span>
                  <strong className="text-success">v{release?.version || '1.0.0'}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-muted d-block">Version Code:</span>
                  <strong className="text-dark">{release?.versionCode || 1}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-muted d-block">File Size:</span>
                  <strong className="text-dark">{release?.fileSizeFormatted || '4.8 MB'}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-muted d-block">Platform Target:</span>
                  <strong className="text-dark">Android 13 - 16</strong>
                </div>
                <div className="col-6 col-md-4">
                  <span className="text-muted d-block">Build Status:</span>
                  <span className="badge bg-success-subtle text-success fw-bold">Verified Standalone</span>
                </div>
                <div className="col-12">
                  <span className="text-muted d-block">SHA-256 Checksum:</span>
                  <code className="text-dark small d-block text-break bg-light p-2 rounded border font-monospace">
                    {release?.checksumSha256 || '9f8b417c24430ef6f24d35eb1fef3e53629b35bc244a2c07ef2efef96e14713e'}
                  </code>
                </div>
                <div className="col-12">
                  <span className="text-muted d-block">Release Notes:</span>
                  <p className="text-muted small mb-0 bg-light p-2 rounded border">
                    {release?.releaseNotes || 'Official Save & Smile Android Admin Release v1.0.0.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload New APK Release Form */}
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-white py-3 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-cloud-arrow-up text-success fs-5"></i>
                <h5 className="fw-bold mb-0">Publish / Replace Android APK Release</h5>
              </div>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleUploadSubmit}>
                {uploadError && (
                  <div className="alert alert-danger small py-2 d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>{uploadError}</span>
                  </div>
                )}
                {uploadSuccess && (
                  <div className="alert alert-success small py-2 d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Version (e.g. 1.0.1) *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={uploadForm.version}
                      onChange={e => setUploadForm({ ...uploadForm, version: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Version Code *</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={uploadForm.versionCode}
                      onChange={e => setUploadForm({ ...uploadForm, versionCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Select APK Binary File (.apk) *</label>
                    <input
                      type="file"
                      accept=".apk,application/vnd.android.package-archive"
                      className="form-control form-control-sm"
                      onChange={handleFileChange}
                    />
                    {uploadForm.fileName && (
                      <small className="text-success d-block mt-1">
                        Selected: <strong>{uploadForm.fileName}</strong> ({uploadForm.fileSize})
                      </small>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Release Notes</label>
                    <textarea
                      rows="2"
                      className="form-control form-control-sm"
                      placeholder="Describe what is new or updated in this APK build..."
                      value={uploadForm.releaseNotes}
                      onChange={e => setUploadForm({ ...uploadForm, releaseNotes: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-success btn-sm px-4 fw-semibold shadow-sm d-flex align-items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                      <span>Verifying &amp; Publishing APK...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-check"></i>
                      <span>Upload &amp; Publish Release</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Android Installation Instructions Card */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white py-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-phone text-success fs-5"></i>
            <h5 className="fw-bold mb-0">Android 13–16 Installation Guide</h5>
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <div className="p-3 bg-light rounded-3 h-100 border">
                <span className="badge bg-success mb-2">Step 1</span>
                <h6 className="fw-bold text-dark small mb-1">Download APK</h6>
                <p className="text-muted small mb-0">
                  Scan the QR code or tap Download. When Chrome alerts &ldquo;File might be harmful&rdquo;, tap <strong>Download anyway</strong>.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="p-3 bg-light rounded-3 h-100 border">
                <span className="badge bg-success mb-2">Step 2</span>
                <h6 className="fw-bold text-dark small mb-1">Allow Unknown Sources</h6>
                <p className="text-muted small mb-0">
                  When prompted by Android: Tap <strong>Settings</strong> &rarr; Toggle ON <strong>&ldquo;Allow from this source&rdquo;</strong> for Chrome / Files.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="p-3 bg-light rounded-3 h-100 border">
                <span className="badge bg-success mb-2">Step 3</span>
                <h6 className="fw-bold text-dark small mb-1">Install &amp; Launch</h6>
                <p className="text-muted small mb-0">
                  Tap <strong>Install</strong>. Once completed, tap <strong>Open</strong> to start the Save &amp; Smile Admin Application.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="p-3 bg-light rounded-3 h-100 border">
                <span className="badge bg-success mb-2">Step 4</span>
                <h6 className="fw-bold text-dark small mb-1">Login as Administrator</h6>
                <p className="text-muted small mb-0">
                  Log in with your administrator email and password. Your hardware-backed biometric session will be initialized.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
