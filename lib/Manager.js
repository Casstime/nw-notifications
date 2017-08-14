const uuid = require('uuid');
const Utility = require('./Utility');
const Notification = require('./Notification');

// chrome.notifications can only display 3 notifications at the same time
const MAX_COUNT = 3;
const DEFAULT_DISPLAY_TIME = 10000;
const CLOSED_BY_USER = 'CLOSED_BY_USER';
const CLOSED_BY_TIMEOUT = 'CLOSED_BY_TIMEOUT';
const CLOSED_BY_CLICK = 'CLOSED_BY_CLICK';

class Manager {
  constructor() {
    this.logger = console;
    this.defaultOptions = {};
    this.displayTime = DEFAULT_DISPLAY_TIME;
    this.queue = [];
    this.current = {};

    chrome.notifications.onClicked.addListener((notificationId) => {
      const notification = this.current[notificationId];
      if (notification) {
        notification.emit('clicked');
        delete this.current[notificationId];
        Utility.clear(notificationId)
          .then(() => notification.emit('closed', CLOSED_BY_CLICK))
          .then((err) => this.logger.error('Clear notification error', err));
      }
    });

    chrome.notifications.onClosed.addListener((notificationId, byUser) => {
      this.logger.info(`${notificationId} closed by ${byUser ? 'user' : 'system' }`);
      const notification = this.current[notificationId];

      if (notification) {
        delete this.current[notificationId];
        notification.emit('closed', CLOSED_BY_USER);
      }

      this.next();
    });
  }

  setDefaultOptions(options) {
    this.defaultOptions = options;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  setDisplayTime(ms) {
    this.displayTime = ms;
  }

  closeAfter(id, ms) {
    Utility.delay(ms)
      .then(() => {
        const notification = this.current[id];
        if (notification) {
          delete this.current[id];
          notification.emit('closed', CLOSED_BY_TIMEOUT);
          Utility.clear(id);
        }
      })
      .catch(err => this.logger.error('Closed notification failed', err));
  }

  next() {
    if (this.creating) {
      return;
    }

    this.creating = true;

    Utility.getCount()
      .then((count) => {
        if (count >= MAX_COUNT) {
          this.logger.info(`Max count of notifications was shown, show later`, count);
          return;
        }

        const notification = this.queue.shift();
        if (!notification) {
          return;
        }

        const id = uuid.v4();
        return Utility.create(id, notification.options)
          .then(() => {
            notification.emit('shown', id);
            this.current[id] = notification;
            const displayTime = notification.options.displayTime || this.displayTime;
            this.logger.info(`Notification created successful, ${id}, will auto closed ${displayTime}ms later`);
            this.closeAfter(id, displayTime);
          })
          .catch((err) => {
            notification.emit('error', err);
            this.logger.error('Create notification error', err, notification);
          });
      })
      .catch(err => this.logger.error('Get notifications count error', err))
      .then(() => {
        this.creating = false;
        if (Object.keys(this.current).length < MAX_COUNT) {
          this.next();
        }
      });
  }

  create(options) {
    const finalOptions = Object.assign({
      type: 'basic',
      requireInteraction: true
    }, this.defaultOptions, options);
    const notification = new Notification(finalOptions);
    this.queue.push(notification);
    this.next();
    return notification;
  }
}

module.exports = Manager;
