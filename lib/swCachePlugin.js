"use strict";

var _path = _interopRequireDefault(require("path"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _lodash = _interopRequireDefault(require("lodash.template"));

var _fs = _interopRequireDefault(require("fs"));

var _url2 = _interopRequireDefault(require("url"));

var _debug = _interopRequireDefault(require("debug"));

var _chalk = _interopRequireDefault(require("chalk"));

var _webpack = require("webpack");

var _TemplateCreatorW = _interopRequireDefault(require("./TemplateCreatorW4"));

var _TemplateCreatorW2 = _interopRequireDefault(require("./TemplateCreatorW2"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var fsAsync = _bluebird.default.promisifyAll(_fs.default);

var debug = (0, _debug.default)('app');
var toClass = {}.toString;

var SwCachePlugin =
/*#__PURE__*/
function () {
  function SwCachePlugin(options) {
    _classCallCheck(this, SwCachePlugin);

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "pluginName", void 0);

    this.options = _objectSpread({}, options);
    this.pluginName = 'SwCachePlugin';
  }

  _createClass(SwCachePlugin, [{
    key: "ignoreAssets",
    value: function ignoreAssets(assets) {
      this.validateType(this.options.ignore, 'Array', 'Ignore must be an array');
      var ignorePatterns = this.options.ignore || [];

      if (ignorePatterns) {
        var ignore = assets.filter(function (text) {
          return !ignorePatterns.some(function (regex) {
            return regex.test(text);
          });
        });
        return ignore;
      }

      return assets;
    }
  }, {
    key: "validateType",
    value: function validateType(value, type, message) {
      if (!value) return;
      var classOfIgnore = toClass.call(value);
      if (!classOfIgnore.includes(type)) throw new Error(message);
    }
  }, {
    key: "addAdditionalPaths",
    value: function addAdditionalPaths(additionals, assets) {
      this.validateType(additionals, 'Array', 'Extras must be an array');
      if (!additionals) return assets;
      return assets.concat(additionals);
    }
  }, {
    key: "setPathToAssets",
    value: function setPathToAssets(publicPath, assets) {
      var assetGlobs = assets.map(function (f) {
        return _url2.default.resolve(publicPath, f);
      });
      return assetGlobs;
    }
  }, {
    key: "getCacheTemplate",
    value: function getCacheTemplate() {
      var filePath = _path.default.join(__dirname, 'template/sw-cache.tmpl');

      return fsAsync.readFileAsync(filePath, 'utf-8');
    }
  }, {
    key: "writeCacheFile",
    value: function writeCacheFile(templateWithData) {
      return function (outputPath) {
        var filePath = _path.default.join(outputPath, '/AssetsManager.js');

        return fsAsync.writeFileAsync(filePath, templateWithData);
      };
    }
  }, {
    key: "populateTemplate",
    value: function populateTemplate(fileTemplate) {
      return function (data) {
        return new _bluebird.default(function (resolve, reject) {
          resolve((0, _lodash.default)(fileTemplate)(data));
        });
      };
    }
  }, {
    key: "showCacheEntries",
    value: function showCacheEntries(log, cacheEntries) {
      log(_chalk.default.blue('Cache entries:'));
      cacheEntries.map(function (entry) {
        log(_chalk.default.green(entry));
      });
    }
  }, {
    key: "getHashesToSave",
    value: function getHashesToSave(assets, hash) {
      var noChunks = 2;
      var assetsWithoutChunks = assets.filter(function (asset) {
        return asset.split('.').length === noChunks;
      });
      var hashes = assetsWithoutChunks.reduce(function (acc, asset) {
        if (!asset.includes(hash)) {
          var parts = asset.split('.');
          acc.push(parts[0]);
        }

        return acc;
      }, [hash]);
      return hashes;
    }
  }, {
    key: "arrayToString",
    value: function arrayToString(arr) {
      var withFormat = arr.map(function (a) {
        return '\'' + a + '\'';
      }).join(',');
      return withFormat;
    }
  }, {
    key: "addOriginPath",
    value: function addOriginPath() {
      var _url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var publicPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      var parsedUrl = _url2.default.parse(_url);

      if (parsedUrl.host) return parsedUrl.href;

      var _originPath = _url2.default.parse(publicPath);

      var mainUrl = "".concat(_originPath.protocol || '', "//").concat(_originPath.host || '');

      var completeUrl = _url2.default.resolve(mainUrl, _url);

      return completeUrl;
    }
  }, {
    key: "formatToShow",
    value: function formatToShow() {
      var _this = this;

      var urls = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var publicPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      var _urls = urls.map(function (url) {
        return _this.addOriginPath(url, publicPath);
      });

      return _urls;
    }
  }, {
    key: "getTemplateCreator",
    value: function getTemplateCreator(compiler) {
      if (!compiler.hooks) {
        return new _TemplateCreatorW2.default(compiler);
      }

      return new _TemplateCreatorW.default(compiler);
    }
  }, {
    key: "apply",
    value: function apply(compiler) {
      var _this2 = this;

      var templateCreator = this.getTemplateCreator(compiler);

      var buildSwTemplate = function buildSwTemplate(_compiler, compilation, callback) {
        var outputPath = _compiler.options.output.path;
        var hash = compilation.hash;
        var publicPath = _compiler.options.output.publicPath;
        var additionals = _this2.options.include;
        var cacheName = _this2.options.cacheName;

        var _assets = templateCreator.getAssets();

        var assets = Object.keys(_assets) || [];

        var filteredAssets = _this2.ignoreAssets(assets);

        var hashesToSave = _this2.getHashesToSave(filteredAssets, hash);

        var cacheEntries = _this2.setPathToAssets(publicPath, filteredAssets);

        var cacheEntries_ = _this2.addAdditionalPaths(additionals, cacheEntries);

        var templateInfo = {
          cacheEntries: _this2.arrayToString(cacheEntries_),
          cacheName: cacheName,
          hashes: _this2.arrayToString(hashesToSave)
        };

        var urlsToShow = _this2.formatToShow(cacheEntries_, publicPath);

        _this2.getCacheTemplate().then(function (fileTemplate) {
          return _this2.populateTemplate(fileTemplate)(templateInfo);
        }).then(function (templateWithData) {
          return _this2.writeCacheFile(templateWithData)(outputPath);
        }).then(function () {
          return _this2.showCacheEntries(console.log, urlsToShow);
        }).catch(function (ex) {
          _chalk.default.red(ex.message);

          throw new Error(ex.message);
        }).then(callback, callback);
      };

      templateCreator.createTemplate(buildSwTemplate);
    }
  }]);

  return SwCachePlugin;
}();

module.exports = SwCachePlugin;