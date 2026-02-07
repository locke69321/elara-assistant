import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div>
          <h1 className="brand-mark">Elara Nexus</h1>
          <p className="brand-subtitle">Agent Command Surface</p>
        </div>
        <div className="header-row">
          <span className="status-pill status-pill--live">Dark mode</span>
          <nav aria-label="Primary navigation" className="primary-nav">
            <ul className="header-row">
              <li>
                <Link to="/">Dashboard</Link>
              </li>
              <li>
                <Link to="/chat">Chat</Link>
              </li>
              <li>
                <Link to="/memory">Memory</Link>
              </li>
              <li>
                <Link to="/settings">Settings</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
