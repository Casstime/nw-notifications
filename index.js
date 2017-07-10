var util = require('util');
var EventEmitter = require('events').EventEmitter;
var uuid = require('uuid/v4');

var MAX_COUNT = 3;
var DISPLAY_TIME = 10 * 1000;
var queue = [];
var defaultOptions = {};
var notifications = {};
var logger = console;
var displaying = false;
var remainCount = 0;

var State = {
  CREATED: 'CREATED',
  SHOWN: 'SHOWN',
  CLOSED: 'CLOSED'
};

var ClosedReason = {
  TIMEOUT: 'TIMEOUT',
  CLOSED_BY_USER: 'CLOSED_BY_USER',
  CLOSED_BY_FUNC: 'CLOSED_BY_FUNC'
};

var ALL_DISPLAY_PROPS = ['type', 'iconUrl', 'title', 'message', 'contextMessage', 'priority',
  'eventTime', 'items', 'progress', 'isClickable', 'requireInteraction'];

function Notification(id, options) {
  EventEmitter.call(this);
  this.id = id;
  this.options = options;
  this.state = State.CREATED;
}

Notification.prototype.close = function () {
  if (this.state !== State.CLOSED) {
    this.state = State.CLOSED;
    this.closedReason = ClosedReason.CLOSED_BY_FUNC;
  }

  chrome.notifications.clear(this.id);
};

Notification.prototype.show = function (beforeCount) {
  var that = this;

  var displayOptions = {};

  // filter valid props
  Object.keys(that.options)
    .filter(function (prop) {
      return ALL_DISPLAY_PROPS.indexOf(prop) > -1
    })
    .forEach(function (prop) {
      displayOptions[prop] = that.options[prop];
    });

  var finalDisplayOptions = Object.assign({
    requireInteraction: true,
    type: 'basic'
  }, defaultOptions, displayOptions);

  return createNotification(that.id, finalDisplayOptions)
    .then(function () {
      var displayTime = that.options.displayTime || DISPLAY_TIME;

      // 指定时间关闭窗口
      setTimeout(function () {
        if (that.state !== State.CLOSED) {
          that.state = State.CLOSED;
          that.closedReason = ClosedReason.TIMEOUT;
          that.close();
        }
      }, displayTime);

      return getDisplayCount();
    })
    .then(function (realCount) {
      if (realCount === remainCount + 1) {
        return;
      }

      throw new Error('Create Notification Error!');
    });
};

// 继承事件
util.inherits(Notification, EventEmitter);

function setConfig(options) {
  defaultOptions = Object.assign({}, options.displayOptions);
  MAX_COUNT = options.maxCount || MAX_COUNT;
  MAX_COUNT = MAX_COUNT > 3 ? 3 : MAX_COUNT;
  DISPLAY_TIME = options.displayTime || DISPLAY_TIME;
  logger = options.logger || logger;
}

function create(options) {
  var notificationId = uuid();

  var notification = new Notification(notificationId, options);
  notifications[notificationId] = notification;

  queue.push(notificationId);

  setTimeout(display, 0);

  return notification;
}

function getDisplayCount() {
  return new Promise(function (resolve, reject) {
    chrome.notifications.getAll(function (currentNotifications) {
      const realCount = Object.keys(currentNotifications).length;
      resolve(realCount);
    });
  });
}

function createNotification(id, options) {
  return new Promise(function (resolve, reject) {
    chrome.notifications.create(id, options, function (id) {
      resolve(id);
    });
  });
}

function display() {
  if (displaying) {
    return;
  }

  displaying = true;
  getDisplayCount()
    .then(function (count) {
      // sync notification count;
      remainCount = count;
      if (count >= MAX_COUNT) {
        return;
      }

      var notificationId = queue.shift();
      if (!notificationId) {
        return;
      }

      var notification = notifications[notificationId];
      if (!notification) {
        return;
      }

      return notification.show()
        .then(function (id) {
          notification.emit('shown', id);
        })
        .catch(function () {
          delete notifications[notificationId];
          notification.emit('error', new Error('Create Notification failed', notification.options));
        })
    })
    .then(function () {
      // display next
      displaying = false;
      display();
    });
}

chrome.notifications.onClosed.addListener(function (notificationId, byUser) {
  remainCount--;

  var notification = notifications[notificationId];
  notification.state = State.CLOSED;

  if (byUser) {
    notification.closedReason = ClosedReason.CLOSED_BY_USER;
  }

  notification.emit('closed', notification.closedReason);

  delete notifications[notificationId];

  display();
});

chrome.notifications.onClicked.addListener(function (notificationId) {
  var notification = notifications[notificationId];
  notification.emit('clicked');
});

module.exports.setConfig = setConfig;
module.exports.create = create;
