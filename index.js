var util = require('util');
var EventEmitter = require('events').EventEmitter;
var uuid = require('uuid/v4');

var MAX_COUNT = 3;
var DISPLAY_TIME = 10 * 1000;
var queue = [];
var defaultOptions = {};
var notifications = {};
var count = 0;

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

var ALL_DISPLAY_PROPS = ['type', 'iconUrl', 'appIconMaskUrl', 'title', 'message', 'contextMessage', 'priority',
  'eventTime', 'imageUrl', 'items', 'progress', 'isClickable', 'requireInteraction'];

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

Notification.prototype.show = function () {
  count++;

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

  var finalDisplayOptions = Object.assign({ requireInteraction: true, type: 'basic' }, defaultOptions, displayOptions);

  try {
    chrome.notifications.create(that.id, finalDisplayOptions, function (id) {

      var displayTime = that.options.displayTime || DISPLAY_TIME;

      that.state = State.SHOWN;

      // 指定时间关闭窗口
      setTimeout(function() {
        if (that.state !== State.CLOSED) {
          that.state = State.CLOSED;
          that.closedReason = ClosedReason.TIMEOUT;
          that.close();
        }
      }, displayTime);

      that.emit('shown', id);
    });
  } catch (e) {
    count--;
    this.emit('error', e);
  }
};

// 继承事件
util.inherits(Notification, EventEmitter);

function setConfig(options) {
  defaultOptions = Object.assign({}, options.displayOptions);
  MAX_COUNT = options.maxCount ||  3;
  DISPLAY_TIME = options.displayTime;
}

function create(options) {
  var notificationId = uuid();

  var notification = new Notification(notificationId, options);
  notifications[notificationId] = notification;

  queue.push(notificationId);

  setTimeout(display, 0);

  return notification;
}

function display() {
  if (count >= MAX_COUNT) {
    return;
  }

  var notificationId = queue.shift();
  if (notificationId) {
    var notification = notifications[notificationId];
    notification.show();
  }
}

chrome.notifications.onClosed.addListener(function (notificationId, byUser) {
  count--;

  var notification = notifications[notificationId];
  notification.state = State.CLOSED;

  if (byUser) {
    notification.closedReason = ClosedReason.CLOSED_BY_USER;
  }

  notification.emit('closed', notification.closedReason);

  display();
});

chrome.notifications.onClicked.addListener(function (notificationId) {
  var notification = notifications[notificationId];
  notification.emit('clicked');
});

module.exports.setConfig = setConfig;
module.exports.create = create;