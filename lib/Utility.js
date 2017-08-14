module.exports.create = function (id, options) {
  return new Promise((resolve, reject) => {
    chrome.notifications.create(id, options, function (id) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(id);
      }
    });
  });
};

module.exports.getAll = function () {
  return new Promise((resolve, reject) => {
    chrome.notifications.getAll(function (currentNotifications) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(currentNotifications);
      }
    });
  });
};

module.exports.clear = function(id) {
  return new Promise((resolve, reject) => {
    chrome.notifications.clear(id, function (wasClear) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(wasClear);
      }
    });
  });
};

module.exports.clearAll = function () {
  return this.getAll()
    .then(
      (all) => Promise.all(
        Object.keys(all).map(id => this.clear(id))
      )
    )
};

module.exports.getCount = function () {
  return this.getAll().then(all => Object.keys(all).length);
};

module.exports.delay = function (delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), delay);
  });
};
