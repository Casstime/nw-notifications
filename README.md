# nw-notifications
A node module for sending notifications in nw applications.

### Install
```
npm install nw-notifications
```

### Usage

#### Notifications.create(options)

More displayOptions see [NotificationOptions](https://developer.chrome.com/extensions/notifications#type-NotificationOptions)

```javascript
var Notifications = require('nw-notifications');
var notification = Notifications.create({
  iconUrl: 'icon.png',
  title: 'title',
  message: 'message'
});
```

#### Notifications.setDefaultOptions(options)


```javascript
Notifications.setDefaultOptions({
  iconUrl: 'icon.png'
});
```

#### Notifications.setDisplayTime(delay)
```javascript
Notification.setDisplayTime(20000); // notification will closed 20s later;
```

### Notifications.setLogger(logger)
Default logger is console

### events

```
notification.on('shown', function () {
  // displayed
});

notification.on('clicked', function () {
  // clicked message body
});

notification.on('closed', function (reason) {
  console.log(reason); 
  // CLOSED_BY_USER
  // CLOSED_BY_TIMEOUT
  // CLOSED_BY_CLICK
});

```

