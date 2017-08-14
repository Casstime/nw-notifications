const { EventEmitter } = require('events');

class Notification extends EventEmitter {
  constructor(options) {
    super();
    this.displayTime = options.displayTime;
    delete options.displayTime;
    this.options = options;
  }
}

module.exports = Notification;
