# nw-notifications
A node module for sending notifications in nw applications.

### Install
```
npm install nw-notifications
```

### Usage

#### create

```javascript
var Notifications = require('nw-notifications');
var notification = Notifications.create({
  iconUrl: 'icon.png',
  title: 'title',
  message: 'message'
});
```

#### setConfig

More displayOptions see [NotificationOptions](https://developer.chrome.com/extensions/notifications#type-NotificationOptions)

```javascript
Notifications.setConfig({
  displayTime: 10 * 1000, // ms
  displayOptions: {
    iconUrl: 'icon.png'
  }
});
```

### event

```
notification.on('shown', function () {
  // displayed
});

notification.on('clicked', function () {
  // clicked message body
});

notification.on('closed', function (reason) {
  console.log(reason); 
  // CLOSED_BY_USER  click close button
  // TIMEOUT         displayTime timeout
  // CLOSED_BY_FUNC  invoke notificaiton.close function
});

```

### method

```
notification.close(); // close current notification
```