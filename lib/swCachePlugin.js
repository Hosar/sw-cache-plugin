'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash.template');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_bluebird2.default.promisifyAll(_fs2.default);
var debug = (0, _debug2.default)('app');

var toClass = {}.toString;

var SwCachePlugin = function () {
    function SwCachePlugin(options) {
        _classCallCheck(this, SwCachePlugin);

        this.options = _extends({}, options);
    }

    _createClass(SwCachePlugin, [{
        key: 'ignoreAssets',
        value: function ignoreAssets(assets) {
            this.validateType(this.options.ignore, 'Array', 'Ignore must be an array');
            var ignorePatterns = this.options.ignore || [];

            if (ignorePatterns) return assets.filter(function (text) {
                return !ignorePatterns.some(function (regex) {
                    return regex.test(text);
                });
            });

            return assets;
        }
    }, {
        key: 'validateType',
        value: function validateType(value, type, message) {
            if (!value) return;

            var classOfIgnore = toClass.call(value);
            if (!classOfIgnore.includes(type)) throw new Error(message);
        }
    }, {
        key: 'addAdditionalPaths',
        value: function addAdditionalPaths(additionals, assets) {
            this.validateType(additionals, 'Array', 'Extras must be an array');
            if (!additionals) return assets;

            return assets.concat(additionals);
        }
    }, {
        key: 'setPathToAssets',
        value: function setPathToAssets(publicPath, assets) {
            var assetGlobs = assets.map(function (f) {
                return _url2.default.resolve(publicPath, f);
            });
            return assetGlobs;
        }
    }, {
        key: 'getCacheTemplate',
        value: function getCacheTemplate() {
            var filePath = _path2.default.join(__dirname, 'template/sw-cache.tmpl');
            return _fs2.default.readFileAsync(filePath, 'utf-8');
        }
    }, {
        key: 'writeCacheFile',
        value: function writeCacheFile(templateWithData) {
            return function (outputPath) {
                var filePath = _path2.default.join(outputPath, '/AssetsManager.js');
                return _fs2.default.writeFileAsync(filePath, templateWithData);
            };
        }
    }, {
        key: 'populateTemplate',
        value: function populateTemplate(fileTemplate) {
            return function (data) {
                return new _bluebird2.default(function (resolve, reject) {
                    resolve((0, _lodash2.default)(fileTemplate)(data));
                });
            };
        }
    }, {
        key: 'showCacheEntries',
        value: function showCacheEntries(log, cacheEntries) {
            log(_chalk2.default.blue('Cache entries:'));
            cacheEntries.map(function (entry) {
                log(_chalk2.default.green(entry));
            });
        }
    }, {
        key: 'getHashesToSave',
        value: function getHashesToSave(assets, hash) {
            var hashes = assets.reduce(function (acc, asset) {
                if (!asset.includes(hash)) {
                    var parts = asset.split('.');
                    acc.push(parts[0]);
                }
                return acc;
            }, [hash]);
            return hashes;
        }
    }, {
        key: 'arrayToString',
        value: function arrayToString(arr) {
            var withFormat = arr.map(function (a) {
                return '\'' + a + '\'';
            }).join(',');

            return withFormat;
        }
    }, {
        key: 'apply',
        value: function apply(compiler) {
            var _this = this;

            compiler.plugin('done', function (stats) {
                // get the output path specified in webpack config
                var outputPath = compiler.options.output.path;
                var hash = stats.hash;
                var publicPath = compiler.options.output.publicPath;
                var additionals = _this.options.include;
                var cacheName = _this.options.cacheName;
                var assets = Object.keys(stats.compilation.assets) || [];
                var filteredAssets = _this.ignoreAssets(assets);
                var hashesToSave = _this.getHashesToSave(filteredAssets, hash);
                var cacheEntries = _this.setPathToAssets(publicPath, filteredAssets);
                var cacheEntries_ = _this.addAdditionalPaths(additionals, cacheEntries);

                var templateInfo = {
                    cacheEntries: _this.arrayToString(cacheEntries_),
                    cacheName: cacheName,
                    hashes: _this.arrayToString(hashesToSave)
                };

                _this.getCacheTemplate().then(function (fileTemplate) {
                    return _this.populateTemplate(fileTemplate)(templateInfo);
                }).then(function (templateWithData) {
                    return _this.writeCacheFile(templateWithData)(outputPath);
                }).then(function (success) {
                    _this.showCacheEntries(console.log, cacheEntries_);
                }, function (err) {
                    throw new Error(err);
                });
            });
        }
    }]);

    return SwCachePlugin;
}();

module.exports = SwCachePlugin;