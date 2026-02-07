export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary leading-tight">Elara Nexus</h1>
          <p className="section-subtitle">Core platform dashboard</p>
        </div>
        <nav aria-label="Primary navigation">
          <ul className="flex items-center gap-4">
            <li>
              <a href="/" className="text-sm font-medium text-text-secondary hover:text-text-primary">
                Dashboard
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
