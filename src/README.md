# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Multi-Site-Themes

Die Nuxt-App erkennt die aktive Site anhand der aufgerufenen Frontend-Domain. Unbekannte Domains fallen auf die Default-Site und das bestehende Theme zurück.

```bash
NUXT_PUBLIC_SITE_CONFIG='[
  {
    "key": "default",
    "domains": ["localhost", "robocup.de", "www.robocup.de"],
    "theme": "default",
    "isDefault": true,
    "typo3ApiOrigin": "http://rc-new-website.ddev.site/"
  },
  {
    "key": "wm27",
    "domains": ["wm27.robocup.de"],
    "theme": "wm27",
    "typo3ApiOrigin": "http://rc-new-website.ddev.site/wm27/",
    "typo3Host": "rc-new-website.ddev.site"
  }
]'
```

`typo3ApiOrigin` kann pro Site auf einen eigenen TYPO3-Headless-Einstieg zeigen. Lokal laeuft das Nuxt-Frontend ueber `http://localhost:3000`. Wenn lokal die World-Cup-2027-Site getestet werden soll, muss `localhost` auf diese Site zeigen:

```bash
NUXT_PUBLIC_SITE_CONFIG='[
  {
    "key": "default",
    "domains": ["localhost"],
    "theme": "default",
    "isDefault": true,
    "typo3ApiOrigin": "http://rc-new-website.ddev.site/",
    "typo3Host": "rc-new-website.ddev.site"
  },
  {
    "key": "wm27",
    "domains": ["wm27.localhost"],
    "theme": "wm27",
    "typo3ApiOrigin": "http://rc-new-website.ddev.site/wm27/",
    "typo3Host": "rc-new-website.ddev.site"
  }
]'
```

Damit sind lokal beide Sites gleichzeitig per Host unterscheidbar: `http://localhost:3000` nutzt die Default-Site und `http://wm27.localhost:3000` nutzt die WM27-Site. Der TYPO3-Backend-Einstieg fuer WM27 bleibt trotzdem `http://rc-new-website.ddev.site/wm27/`.

Falls der lokale DDEV-Router nur auf die DDEV-Domain reagiert, kann pro Eintrag optional `typo3Host` gesetzt werden, z. B. `"typo3Host": "rc-new-website.ddev.site"`.

Die Theme-Farben liegen zentral in `assets/styles/app/tailwind.css`. Das WM27-Theme ist aktuell mit Platzhalter-Brand-Farben als `:root[data-theme="wm27"]` definiert und kann dort ersetzt werden, sobald finale Farben vorliegen.

TYPO3-Requests laufen weiterhin ueber `/api/typo3`. Der Proxy waehlt anhand der erkannten Site den passenden `typo3ApiOrigin`, reicht den Frontend-Host als `X-Forwarded-Host` weiter und trennt den Upstream-Cache pro Site, damit gleiche Pfade auf unterschiedlichen Domains unterschiedliche TYPO3-Seiten ausliefern koennen.

Um spaeter eine weitere Site zu ergaenzen:

1. Einen Eintrag in `NUXT_PUBLIC_SITE_CONFIG` mit `key`, `domains`, `theme`, optionalem `typo3ApiOrigin` und optionalem `typo3Host` ergaenzen.
2. In `assets/styles/app/tailwind.css` einen passenden `:root[data-theme="..."]`-Block mit Design Tokens definieren.
3. Zum Abschalten einer zeitlich begrenzten Site den entsprechenden Config-Eintrag entfernen.
