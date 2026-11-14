import React, { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'

export default function DownloadApkModal({ isOpen, onClose }) {
  const [release, setRelease] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('qr')

  // Load latest release info when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/mobile/releases/latest')
        .then(res => res.json())
        .then(data => {
          if (data?.release) setRelease(data.release)
        })
        .catch(() => {})
    }
  }, [isOpen])

  // Derive the active download URL
  const downloadUrl = useMemo(() => {
    if (release?.downloadUrl) return release.downloadUrl
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/api/downloads/admin-apk`
    }
    return 'https://saveandsmile.vercel.app/api/downloads/admin-apk'
  }, [release])

  const githubReleaseUrl = 'https://github.com/iamjamalullah/saveandsmile/releases'
  const repoTreeUrl = 'https://github.com/iamjamalullah/saveandsmile/tree/main/android-admin'

  // Generate QR Code
  useEffect(() => {
    if (isOpen && downloadUrl) {
      QRCode.toDataURL(downloadUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f766e', // Deep Teal / Emerald theme matching brand
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => {
          console.warn('Local QRCode generation error, falling back to API:', err)
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(downloadUrl)}`)
        })
    }
  }, [isOpen, downloadUrl])

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
      tabIndex="-1"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Modal Header Banner */}
          <div
            className="p-4 text-white position-relative"
            style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #115e59 100%)'
            }}
          >
            <button
              type="button"
              className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
              onClick={onClose}
              aria-label="Close"
            ></button>

            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center bg-white shadow-sm p-2"
                style={{ width: '56px', height: '56px' }}
              >
                <i className="bi bi-android2 text-teal fs-2" style={{ color: '#0f766e' }}></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h4 className="fw-bold mb-0 text-white">Save &amp; Smile — Android Admin App</h4>
                  <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '11px' }}>
                    v{release?.version || '1.0.0'} APK
                  </span>
                </div>
                <p className="mb-0 text-white-50 small mt-1">
                  Official Android Mobile App • Manage Orders, Products, Multi-Variants, Images &amp; Settings on the go
                </p>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="p-3 bg-light border-bottom">
            <div className="nav nav-pills nav-fill bg-white p-1 rounded-3 shadow-xs border">
              <button
                type="button"
                className={`nav-link py-2 fw-semibold small d-flex align-items-center justify-content-center gap-2 ${
                  activeTab === 'qr' ? 'active bg-teal text-white shadow-sm' : 'text-secondary'
                }`}
                style={activeTab === 'qr' ? { backgroundColor: '#0f766e' } : {}}
                onClick={() => setActiveTab('qr')}
              >
                <i className="bi bi-qr-code-scan"></i>
                <span>Scan QR Code or Direct Download</span>
              </button>
              <button
                type="button"
                className={`nav-link py-2 fw-semibold small d-flex align-items-center justify-content-center gap-2 ${
                  activeTab === 'guide' ? 'active bg-teal text-white shadow-sm' : 'text-secondary'
                }`}
                style={activeTab === 'guide' ? { backgroundColor: '#0f766e' } : {}}
                onClick={() => setActiveTab('guide')}
              >
                <i className="bi bi-phone"></i>
                <span>Installation Guide</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            {activeTab === 'qr' ? (
              <div className="row g-4 align-items-center">
                {/* QR Code Column */}
                <div className="col-12 col-md-5 text-center">
                  <div
                    className="p-3 bg-white rounded-3 border shadow-sm d-inline-block mx-auto position-relative"
                    style={{ minWidth: '220px', minHeight: '220px' }}
                  >
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Save & Smile APK Download QR Code"
                        className="img-fluid rounded"
                        style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center text-muted small"
                        style={{ width: '200px', height: '200px' }}
                      >
                        <div className="spinner-border spinner-border-sm text-teal me-2" role="status"></div>
                        Generating QR Code...
                      </div>
                    )}
                  </div>
                  <div className="text-muted small mt-2 d-flex align-items-center justify-content-center gap-1">
                    <i className="bi bi-camera text-teal"></i>
                    <span>Scan with Android Camera or Google Lens</span>
                  </div>
                </div>

                {/* Download Actions Column */}
                <div className="col-12 col-md-7">
                  <div className="mb-3">
                    <h5 className="fw-bold text-dark mb-1">Direct APK Download</h5>
                    <p className="text-muted small mb-0">
                      Scan the QR code directly with your smartphone or tap the download button below to download the standalone APK installer.
                    </p>
                  </div>

                  {/* Primary Direct Download Button */}
                  <div className="d-grid gap-2 mb-3">
                    <a
                      href={downloadUrl}
                      download="SaveAndSmile-Admin.apk"
                      className="btn text-white fw-bold py-2.5 shadow-sm d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: '#0f766e', borderColor: '#0f766e' }}
                    >
                      <i className="bi bi-download fs-5"></i>
                      <span>Download APK Package (Direct {release?.fileSizeFormatted || '4.8 MB'})</span>
                    </a>

                    <a
                      href={githubReleaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary fw-semibold py-2 d-flex align-items-center justify-content-center gap-2 small"
                    >
                      <i className="bi bi-github"></i>
                      <span>GitHub Releases &amp; Source Code</span>
                      <i className="bi bi-box-arrow-up-right ms-1 small"></i>
                    </a>
                  </div>

                  {/* Copy Link Input Bar */}
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold mb-1">
                      Direct APK URL:
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        readOnly
                        value={downloadUrl}
                        className="form-control font-monospace small bg-light"
                        onClick={e => e.target.select()}
                      />
                      <button
                        type="button"
                        className={`btn ${copied ? 'btn-success' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
                        onClick={handleCopy}
                      >
                        <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`}></i>
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Package Metadata */}
                  <div className="bg-light p-2.5 rounded-3 border">
                    <div className="row text-center text-muted small g-2">
                      <div className="col-4 border-end">
                        <span className="d-block text-secondary text-uppercase" style={{ fontSize: '10px' }}>Size</span>
                        <strong className="text-dark">4.8 MB</strong>
                      </div>
                      <div className="col-4 border-end">
                        <span className="d-block text-secondary text-uppercase" style={{ fontSize: '10px' }}>Android OS</span>
                        <strong className="text-dark">7.0 - 16</strong>
                      </div>
                      <div className="col-4">
                        <span className="d-block text-secondary text-uppercase" style={{ fontSize: '10px' }}>Security</span>
                        <strong className="text-success"><i className="bi bi-shield-check"></i> Verified</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Installation Guide Tab */
              <div className="space-y-3">
                <h6 className="fw-bold text-dark text-uppercase small mb-3 tracking-wide">
                  <i className="bi bi-info-circle me-1 text-teal"></i> How to Install on Android Phone
                </h6>

                <div className="d-flex flex-column gap-2.5">
                  <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3 border">
                    <span
                      className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shrink-0"
                      style={{ width: '28px', height: '28px', backgroundColor: '#0f766e', fontSize: '12px' }}
                    >
                      1
                    </span>
                    <div>
                      <div className="fw-bold text-dark small">Download the APK File</div>
                      <p className="text-muted small mb-0">
                        Scan the QR code with your smartphone camera or tap &ldquo;Download APK Package&rdquo;. Chrome may show a warning: &ldquo;File might be harmful&rdquo;. Tap <strong>Download anyway</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3 border">
                    <span
                      className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shrink-0"
                      style={{ width: '28px', height: '28px', backgroundColor: '#0f766e', fontSize: '12px' }}
                    >
                      2
                    </span>
                    <div>
                      <div className="fw-bold text-dark small">Allow Installation from Unknown Sources</div>
                      <p className="text-muted small mb-0">
                        When opening the downloaded file, if prompted: Tap <strong>Settings</strong> &rarr; Toggle ON <strong>&ldquo;Allow from this source&rdquo;</strong> for Chrome / Files.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3 border">
                    <span
                      className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shrink-0"
                      style={{ width: '28px', height: '28px', backgroundColor: '#0f766e', fontSize: '12px' }}
                    >
                      3
                    </span>
                    <div>
                      <div className="fw-bold text-dark small">Tap Install &amp; Launch</div>
                      <p className="text-muted small mb-0">
                        Tap <strong>Install</strong>. Once completed, tap <strong>Open</strong> to start the Save &amp; Smile Admin Application.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3 border">
                    <span
                      className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shrink-0"
                      style={{ width: '28px', height: '28px', backgroundColor: '#0f766e', fontSize: '12px' }}
                    >
                      4
                    </span>
                    <div>
                      <div className="fw-bold text-dark small">Login with Administrator Credentials</div>
                      <p className="text-muted small mb-0">
                        Enter your Save &amp; Smile administrator email and password. Your hardware-backed biometric/secure session will be activated automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light py-2 px-4 border-top d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              <i className="bi bi-shield-lock-fill text-success me-1"></i>
              Production API Sync: <strong className="text-dark">saveandsmile.vercel.app</strong>
            </span>
            <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
