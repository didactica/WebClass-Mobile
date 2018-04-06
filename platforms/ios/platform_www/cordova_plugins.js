cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "org.apache.cordova.dialogs.notification",
    "file": "plugins/org.apache.cordova.dialogs/www/notification.js",
    "pluginId": "org.apache.cordova.dialogs",
    "merges": [
      "navigator.notification"
    ]
  },
  {
    "id": "org.apache.cordova.inappbrowser.inappbrowser",
    "file": "plugins/org.apache.cordova.inappbrowser/www/inappbrowser.js",
    "pluginId": "org.apache.cordova.inappbrowser",
    "clobbers": [
      "window.open"
    ]
  },
  {
    "id": "org.apache.cordova.network-information.network",
    "file": "plugins/org.apache.cordova.network-information/www/network.js",
    "pluginId": "org.apache.cordova.network-information",
    "clobbers": [
      "navigator.connection",
      "navigator.network.connection"
    ]
  },
  {
    "id": "org.apache.cordova.network-information.Connection",
    "file": "plugins/org.apache.cordova.network-information/www/Connection.js",
    "pluginId": "org.apache.cordova.network-information",
    "clobbers": [
      "Connection"
    ]
  },
  {
    "id": "org.apache.cordova.splashscreen.SplashScreen",
    "file": "plugins/org.apache.cordova.splashscreen/www/splashscreen.js",
    "pluginId": "org.apache.cordova.splashscreen",
    "clobbers": [
      "navigator.splashscreen"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-whitelist": "1.0.0",
  "org.apache.cordova.dialogs": "0.3.0",
  "org.apache.cordova.inappbrowser": "0.6.0",
  "org.apache.cordova.network-information": "0.2.15",
  "org.apache.cordova.splashscreen": "1.0.0"
};
// BOTTOM OF METADATA
});