"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TemplateCreatorW2 =
/*#__PURE__*/
function () {
  function TemplateCreatorW2(compiler) {
    _classCallCheck(this, TemplateCreatorW2);

    this._compiler = compiler;
    this._compilation = null;
  }

  _createClass(TemplateCreatorW2, [{
    key: "getAssets",
    value: function getAssets() {
      return this._compilation.compilation.assets;
    }
  }, {
    key: "createTemplate",
    value: function createTemplate(fn) {
      var _this = this;

      this._compiler.plugin('done', function (stats) {
        _this._compilation = stats;

        var callback = function callback() {};

        fn(_this._compiler, stats, callback);
      });
    }
  }]);

  return TemplateCreatorW2;
}();

exports.default = TemplateCreatorW2;