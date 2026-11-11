import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="qpage qnotfound">
      <div className="qg-container qpage-narrow">
        <b>404</b>
        <h1>Page not found</h1>
        <p>The page you were looking for doesn’t exist or has moved.</p>
        <div className="qnotfound-actions">
          <Link className="qg-btn qg-btn-primary" to="/">Back to home</Link>
          <Link className="qg-btn qg-btn-outline" to="/shop">Shop all products</Link>
        </div>
      </div>
    </main>
  )
}
