# sw-cache-plugin
[![CircleCI][circleci-img]][circleci-url]


Webpack plugin that allows to cache generated assets in your own service worker.


Description
-------
Inspired by @goldhand [SWPrecacheWebpackPlugin][sw-precache-webpack], for most all the cases [SWPrecacheWebpackPlugin][sw-precache-webpack] is the right choice. Use this plugin when you have your
**own** [service worker][0e425270] and you need to cache the Webpack generated assets which already include a versioning hash.

## Version 1.0.0
Includes support for Webpack 4.16.5

## Install
`npm install sw-cache-plugin --save-dev`

## Basic Usage
```
//webpack.config.js

const swCachePlugin = require('sw-cache-plugin');

plugins: [
    new swCachePlugin(
      {
        cacheName:'cacheName',
        ignore: [/.*\.map$/],
        include: ['/','/additional']
      }
    )
  ]
```
  This will generate an **AssetsManager.js** script file on your output path. Later in your sw.js file
import the script.
`importScripts('/dist/AssetsManager.js');`

Now you can use it to save the generated assets in the app cache as follow:

***sw.js***
```
importScripts('/dist/AssetsManager.js');
let assetsManager = new AssetsManager(); //create an instance of AssetsManager

//save the url-assets in cache
self.addEventListener('install', (event) => {
  event.waitUntil(assetsManager.addAllToCache());
});
```
Or remove:
```
self.addEventListener('activate', event => {
  event.waitUntil(assetsManager.removeNotInAssets());
});
```
## Configuration

**Plugin options:**
- `cacheName: [String]` name for your cache object.
- `ignore: [Array]` **regex** to avoid assets to be included in the cache entries.
- `include: [Array]` Additionals strings url to be included in the cache.

**Methods:**
- `addAllToCache()` add all webpack generated assets to browser app cache.
- `removeNotInAssets()` remove all current request that are in app cache, but not in the current
                        webpack generated assets.

**Properties:**
- `cacheEntries [Array]` contains an array with the url for all generated assets to be cached.
- `cacheName [String]` app cache name.

**Webpack dev server support:**
- add [write-file-webpack-plugin][69fb7c2c] to work with webpack dev server.


  [69fb7c2c]: https://github.com/gajus/write-file-webpack-plugin "write-file-plugin"


[sw-precache-webpack]: https://github.com/goldhand/sw-precache-webpack-plugin
[circleci-url]: https://circleci.com/gh/Hosar/sw-cache-plugin
[circleci-img]: https://circleci.com/gh/Hosar/sw-cache-plugin.svg?style=svg
  [0e425270]: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers "sw-worker"

