import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import Header from '../components/Header'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Elara Nexus' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-100 text-slate-900">
        <Header />
        <main className="mx-auto max-w-7xl p-4">{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
