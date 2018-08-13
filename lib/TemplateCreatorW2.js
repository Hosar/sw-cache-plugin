'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TemplateCreatorW2 = function () {
    function TemplateCreatorW2(compiler) {
        _classCallCheck(this, TemplateCreatorW2);

        this._compiler = compiler;
        this._compilation = null;
    }

    _createClass(TemplateCreatorW2, [{
        key: 'getAssets',
        value: function getAssets() {
            return this._compilation.compilation.assets;
        }
    }, {
        key: 'createTemplate',
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