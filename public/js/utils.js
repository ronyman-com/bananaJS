// js/utils.js
import { AppState } from "./app-state.js";

class Utils {
    constructor(appState) {
      this.app = appState;
    }

    formatFileSize(bytes) {
      if (typeof bytes !== 'number' || isNaN(bytes)) return 'NaN';
      if (!isFinite(bytes)) return 'Infinity';
      if (bytes === 0) return '0 B';

      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));

      const unitIndex = Math.min(i, sizes.length - 1);
      const size = bytes / Math.pow(1024, unitIndex);
      return `${size.toFixed(2)} ${sizes[unitIndex]}`;
    }

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.app.notificationManager.showNotification('Copied to clipboard', 'success');
      }).catch(err => {
        this.app.notificationManager.showNotification('Failed to copy to clipboard', 'error');
      });
    }
  }
export { Utils };
