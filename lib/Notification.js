const { EventEmitter } = require('events');

class Notification extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
  }
}

module.exports = Notification;
