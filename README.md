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
![alt text](/public/banan_002.png)


### banana-docs



bananaJS/\
├── public/\
│   ├── index.html\
│   ├── styles/\
│   │   └── main.css\
│   ├── main.js\
│   ├── logo.svg\
│   ├── github-icon.svg\
│   └── dashboard.html\
├── src/\
│   ├── components/\
│   │   ├── Navbar.jsx\
│   │   ├── Sidebar.jsx\
│   │   └── Footer.jsx\
│   ├── pages/\
│   │   ├── Home.jsx\
│   │   ├── GettingStarted.jsx\
│   │   ├── Features.jsx\
│   │   ├── Plugins.jsx\
│   │   ├── ApiReference.jsx\
│   │   ├── Examples.jsx\
│   │   ├── Blog.jsx\
│   │   ├── Changelog.jsx\
│   │   └── News.jsx\
│   ├── router/\
│   │   └── index.js\
│   ├── styles/\
│   │   └── main.css\
│   ├── App.jsx\
│   └── main.jsx\
├── plugins/
│   ├── css.js\
│   ├── typescript.js\
│   ├── react.js\
│   └── vue.js\
├── dist/\
│   ├── bundle.js\
│   ├── main.css\
│   └── assets/\
│       ├── logo.svg\
│       ├── github-icon.svg\
│       └── images/\
├── server.js\
├── build.js\
├── banana.config.js\
├── package.json\
├── tailwind.config.js\
├── postcss.config.js\
└── README.md\




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