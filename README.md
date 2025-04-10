## Start Page
![alt text](/public/bannaJs-index.png)

## Create Project or App from browser.
![alt text](/public/bannaJs-create-browser.png)



### Banana.js Overview
Banana.js is a modern frontend framework designed for fast development and optimized builds. It leverages native ES modules for development and provides a plugin-based architecture for extensibility. Key features include:

Instant Server Start: Uses native ES modules for lightning-fast development server startup.

Hot Module Replacement (HMR): Updates modules in real-time without a full reload.

Plugin System: Extensible via plugins for handling various file types and optimizations.

Optimized Production Build: Bundles and minifies code for production.

## Core Architecture
Development Server: A lightweight server that serves ES modules directly to the browser.

Build System: A production build tool that bundles and optimizes assets.

Plugin System: A modular system for handling different file types (e.g., JS, CSS, images).

HMR: A mechanism to update modules in the browser without a full reload.


# 1-Create a new project:

# Use template Vue
`banana create my-app --vue`

# User template react
banana create my-app --react

# 2-Install dependencies:

`cd my-app
npm install or yarn`


# Start the development server:
`yarn dev
yarn build`

## Create Project or App from CLI.
![alt text](/public/cli_print.png)


### banana-docs



bananaJS/
├── Banana/                  # Core framework implementation
│   ├── public/              # Static assets served directly to clients
│   │   ├── index.html       # Main HTML entry point with root DOM element
│   │   ├── styles/          # Global CSS styles (not component-scoped)
│   │   │   └── main.css     # Framework-wide styles and CSS variables
│   │   ├── main.js          # Bundled client-side entry point
│   │   ├── logo.svg         # Brand logo in vector format
│   │   ├── github-icon.svg  # GitHub logo for integrations
│   │   └── dashboard.html   # Admin dashboard template
│   ├── src/                 # Framework source code (pre-compilation)
│   │   ├── components/      # Reusable UI components (JSX)
│   │   │   ├── Navbar.jsx   # Top navigation bar component
│   │   │   ├── Sidebar.jsx  # Collapsible side navigation
│   │   │   └── Footer.jsx   # Page footer with copyright/links
│   │   ├── pages/           # Route-based page components
│   │   │   ├── Home.jsx     # Marketing landing page
│   │   │   ├── GettingStarted.jsx  # Installation docs
│   │   │   ├── Features.jsx # Framework feature highlights
│   │   │   ├── Plugins.jsx  # Plugin system documentation
│   │   │   ├── ApiReference.jsx # Auto-generated API docs
│   │   │   ├── Examples.jsx # Interactive code examples
│   │   │   ├── Blog.jsx     # Blog post listings
│   │   │   ├── Changelog.jsx # Version release notes
│   │   │   └── News.jsx     # Project announcements
│   │   ├── router/          # Client-side routing logic
│   │   │   └── index.js     # Route definitions and history config
│   │   ├── styles/          # Component-scoped styles
│   │   │   └── main.css     # CSS for framework components
│   │   ├── App.jsx          # Root application layout component
│   │   └── main.jsx         # React DOM render entry point
│   ├── dist/                # Production build output (auto-generated)
│   ├── node_modules/        # NPM dependencies (auto-generated)
│   ├── .env.example         # Environment variable template
│   ├── .env.production      # Production-specific configs
│   └── .env.development     # Development environment vars

├── bin/                     # Command-line interface tools
│   ├── banana.config.json   # CLI configuration defaults
│   ├── build.cjs            # Production build script (CommonJS)
│   ├── cli.cjs              # Main CLI entry point (commands)
│   └── server.cjs           # Development server implementation

├── lib/                     # Shared JavaScript libraries
│   ├── cli-version.cjs      # Version checking/management
│   ├── create-app.cjs       # Scaffolds new applications
│   ├── create-project.cjs   # Creates full project structure
│   └── detect-framework.cjs # Detects framework in existing projects

├── public/                  # Global static assets
│   ├── scripts/             # Shared JavaScript utilities
│   ├── styles/              # Shared CSS resources
│   │   ├── banana.css       # Core framework styles
│   │   └── main.css         # Base normalization/reset styles
│   ├── dashboard.html       # Admin dashboard entry point
│   ├── favicon.ico          # Browser tab icon
│   ├── github-icon          # GitHub integration assets
│   ├── index.html           # Fallback HTML for SPA
│   ├── logo.svg             # Brand logo variants
│   ├── main.js              # Legacy script entry
│   ├── main.ts              # TypeScript entry point
│   └── site.webmanifest     # PWA configuration

├── src/                     # Application source code
│   ├── pages/               # View components
│   │   ├── Dashboard.jsx    # Admin interface
│   │   ├── Home.jsx         # Main landing page
│   │   └── NotFound.jsx     # 404 error page
│   ├── router/              # Application routing
│   │   └── index.js         # Route configuration
│   ├── services/            # Business logic/services
│   │   ├── api.js           # REST API client
│   │   └── websocket.js     # Real-time communication
│   ├── styles/              # Application styles
│   │   └── main.css         # Global style rules
│   ├── utils/               # Helper functions
│   │   └── security.js      # Authentication utilities
│   ├── App.jsx              # Root component
│   ├── App.module.css       # CSS Modules styles
│   ├── index.js             # Legacy entry point
│   ├── main.jsx             # Modern React entry
│   ├── main.ts              # TypeScript entry
│   ├── server.js            # Express server config
│   └── styles.scss          # Sass stylesheet

├── Projects/                # Example implementations
│   └── templates/           # Blueprint projects
│       └── default/         # Default starter template
│           └├── public/              # Static assets served directly to clients
            │   │   ├── index.html       # Main HTML entry point with root DOM element
            │   │   ├── styles/          # Global CSS styles (not component-scoped)
            │   │   │   └── main.css     # Framework-wide styles and CSS variables
            │   │   ├── main.js          # Bundled client-side entry point
            │   │   ├── logo.svg         # Brand logo in vector format
            │   │   ├── github-icon.svg  # GitHub logo for integrations
            │   │   └── dashboard.html   # Admin dashboard template
            │   ├── src/                 # Framework source code (pre-compilation)
            │   │   ├── components/      # Reusable UI components (JSX)
            │   │   │   ├── Navbar.jsx   # Top navigation bar component
            │   │   │   ├── Sidebar.jsx  # Collapsible side navigation
            │   │   │   └── Footer.jsx   # Page footer with copyright/links
            │   │   ├── pages/           # Route-based page components
            │   │   │   ├── Home.jsx     # Marketing landing page
            │   │   │   ├── GettingStarted.jsx  # Installation docs
            │   │   │   ├── Features.jsx # Framework feature highlights
            │   │   │   ├── Plugins.jsx  # Plugin system documentation
            │   │   │   ├── ApiReference.jsx # Auto-generated API docs
            │   │   │   ├── Examples.jsx # Interactive code examples
            │   │   │   ├── Blog.jsx     # Blog post listings
            │   │   │   ├── Changelog.jsx # Version release notes
            │   │   │   └── News.jsx     # Project announcements
            │   │   ├── router/          # Client-side routing logic
            │   │   │   └── index.js     # Route definitions and history config
            │   │   ├── styles/          # Component-scoped styles
            │   │   │   └── main.css     # CSS for framework components
            │   │   ├── App.jsx          # Root application layout component
            │   │   └── main.jsx         # React DOM render entry point
            │   ├── dist/                # Production build output (auto-generated)
            │   ├── node_modules/        # NPM dependencies (auto-generated)
            │   ├── .env.example         # Environment variable template
            │   ├── .env.production      # Production-specific configs
            │   └── .env.development     # Development environment vars

├── templates/               # Framework-agnostic starters
│   ├── docs/                # Documentation site template
│   │   ├── dist/            # Built assets directory
│   │   │   ├── bundle.js    # Webpack/Rollup output
│   │   │   └── bundle.js.map # Debug source maps
│   │   ├── public/          # Static documentation assets
│   │   │   └── styles/      # Doc-specific styles
│   │   │       └── main.css 
│   │   ├── src/             # Documentation source
│   │   │   ├── pages/       # Documentation views
│   │   │   │   ├── ApiReference.vue  # API docs
│   │   │   │   ├── Blog.vue # Blog system
│   │   │   │   ├── Examples.vue # Code samples
│   │   │   │   ├── Features.vue # Feature highlights
│   │   │   │   ├── Home.vue    # Docs homepage
│   │   │   │   └── Plugins.vue # Plugin docs
│   │   │   ├── router/      # Vue router config
│   │   │   │   └── index.js 
│   │   │   ├── styles/      # Component styles
│   │   │   │   └── main.css 
│   │   │   └── main.js      # Vue initialization
│   │   ├── App.vue          # Root Vue component
│   │   └── [config files]   # Build tool configs
│   ├── react/               # React starter kit
│   │   ├── src/             # React source
│   │   │   ├── components/  # Presentational components
│   │   │   ├── styles/      # React styling
│   │   │   │   └── App.scss # Sass stylesheet
│   │   │   ├── App.jsx      # Root component
│   │   │   └── main.js      # ReactDOM render
│   │   └── [config files]   # React-specific configs
│   └── vue/                 # Vue starter kit
│       ├── public/          # Vue static assets
│       │   └── index.html   # Mount point
│       ├── src/             # Vue source
│       │   ├── components/  # Vue components
│       │   │   └── HelloWorld.vue # Example
│       │   ├── App.vue      # Root Vue instance
│       │   └── main.js      # Vue initialization
│       └── [config files]   # Vue build configs

├── plugins/                 # Framework extensions
│   ├── css-modules.js       # CSS Modules support
│   ├── css.js               # CSS processing
│   ├── scss.js              # Sass compilation
│   ├── typescript.js        # TypeScript transpilation
│   ├── react.js             # React specific transforms
│   └── vue.js               # Vue single-file components

├── dist/                    # Final build artifacts
│   ├── bundle.js            # Minified production bundle
│   ├── main.css             # Optimized CSS output
│   └── assets/              # Processed static assets
│       ├── logo.svg         # Optimized vector logo
│       ├── github-icon.svg  # Minified SVG
│       └── images/          # Compressed images

├── [Root Config Files]      # Project configuration
│   ├── banana.config.js     # Framework-specific settings
│   ├── package.json        # NPM package manifest
│   ├── tailwind.config.js  # Tailwind CSS config
│   ├── postcss.config.js   # PostCSS plugins
│   ├── vite.config.js      # Vite build config
│   └── README.md           # Project documentation

├── [Supporting Files]       # Auxiliary project files
│   ├── .env                # Local environment variables
│   ├── .gitignore          # Version control exclusions
│   ├── yarn.lock           # Yarn dependency tree
│   ├── registry.js         # Plugin registry API
│   └── marketplace.js      # Plugin discovery system




Explanation of Files and Folders
1. public/
index.html: The main HTML file for the website.

styles/main.css: The global CSS file (processed by Tailwind CSS).

main.js: The entry point for the application (used in development).

logo.svg: The logo for the website.

github-icon.svg: The GitHub icon for the navbar.

dashboard.html: The dashboard page for monitoring performance.

2. src/
components/: Reusable React components.

Navbar.jsx: The navigation bar component.

Sidebar.jsx: The sidebar menu component.

Footer.jsx: The footer component.

pages/: React pages for the website.

Home.jsx: The homepage.

GettingStarted.jsx: The "Getting Started" page.

Features.jsx: The "Features" page.

Plugins.jsx: The "Plugins" page.

ApiReference.jsx: The "API Reference" page.

Examples.jsx: The "Examples" page.

Blog.jsx: The "Blog" page.

Changelog.jsx: The "Changelog" page.

News.jsx: The "News" page.

router/: React Router configuration.

index.js: The router configuration file.

styles/: Global styles.

main.css: The Tailwind CSS file.

App.jsx: The root React component.

main.jsx: The entry point for the React application.

3. plugins/
css.js: Plugin for handling CSS files.

typescript.js: Plugin for handling TypeScript files.

react.js: Plugin for handling React JSX files.

vue.js: Plugin for handling Vue files.

4. dist/
bundle.js: The bundled JavaScript file for production.

main.css: The bundled CSS file for production.

assets/: Static assets (e.g., images, fonts).

logo.svg: The logo for the website.

github-icon.svg: The GitHub icon for the navbar.

images/: Additional images used in the website.

5. Root Files
server.js: The development server script.

build.js: The production build script.

banana.config.js: Configuration file for banana.js.

package.json: Project dependencies and scripts.

tailwind.config.js: Tailwind CSS configuration.

postcss.config.js: PostCSS configuration (used with Tailwind CSS).

README.md: Project documentation.




### Basic React Project Template for BananaJS

banana-react-template/\
├── public/\
│   ├── index.html\
│   ├── favicon.ico\
│   └── manifest.json\
├── src/\
│   ├── components/\
│   │   ├── Navbar.jsx\
│   │   ├── Footer.jsx\
│   ├── pages/\
│   │   ├── Home.jsx\
│   │   ├── About.jsx\
│   ├── App.jsx\
│   ├── main.jsx\
│   ├── styles/\
│   │   ├── main.css\
├── .gitignore\
├── package.json\
├── README.md\
├── banana.config.js\
└── tailwind.config.js\