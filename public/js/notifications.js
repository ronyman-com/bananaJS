import { AppState } from "./app-state.js";

    class NotificationManager {
        constructor(appState) {
          this.appState = appState;
        }

        showNotification(message, type = 'info', duration = 5000) {
          const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>'
          };

          const notification = document.createElement('div');
          notification.className = `notification notification-${type}`;
          notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
          `;

          document.body.appendChild(notification);

          setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s forwards';
            notification.addEventListener('animationend', () => {
              notification.remove();
            });
          }, duration);

          notification.addEventListener('click', () => {
            notification.style.animation = 'fadeOut 0.3s forwards';
            notification.addEventListener('animationend', () => {
              notification.remove();
            });
          });
        }
      }

    export { NotificationManager };
