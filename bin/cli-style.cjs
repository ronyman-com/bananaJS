// cli-style.cjs
let chalk, gradient, figlet, boxen;

async function loadDependencies() {
  chalk = (await import('chalk')).default;
  gradient = (await import('gradient-string')).default;
  figlet = (await import('figlet')).default;
  boxen = (await import('boxen')).default;
}

// Immediately invoke and handle errors
loadDependencies().catch(err => {
  console.error('Failed to load dependencies:', err);
  process.exit(1);
});

// Style configurations
function getStyles() {
  const primaryGradient = gradient('cyan', 'violet');
  const secondaryGradient = gradient('pink', 'orange');

  return {
    error: chalk.bold.red,
    success: chalk.bold.green,
    highlight: chalk.bold.cyan,
    command: chalk.bold.yellow,
    option: chalk.italic.gray,
    warn: chalk.yellow,
    debug: chalk.gray,
    primary: primaryGradient,
    secondary: secondaryGradient
  };
}

// Banner generator
function showBanner(version) {
  const styles = getStyles();
  return boxen(
    styles.primary(
      figlet.textSync('BananaJS', {
        horizontalLayout: 'full',
        font: 'ANSI Shadow'
      })
    ) +
    `\n${styles.secondary('A modern JavaScript framework toolkit')}\n` +
    chalk.gray(`Version ${version}`),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }
  );
}

// Debug logger
function debugLog(...args) {
  if (process.env.DEBUG) {
    console.debug(getStyles().debug('[DEBUG]', ...args));
  }
}

module.exports = {
  getStyles,
  showBanner,
  debugLog
};