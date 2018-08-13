import path from 'path';
import Promise from 'bluebird';
import template from 'lodash.template';
import fs from 'fs';
import URL from 'url';
import $debug from 'debug';
import chalk from 'chalk';
import TemplateCreatorW4 from './TemplateCreatorW4';
import TemplateCreatorW2 from './TemplateCreatorW2';

Promise.promisifyAll(fs);
const debug = $debug('app');

const toClass = {}.toString;

class SwCachePlugin {
    constructor(options) {
        this.options = {
            ...options,
        }
        this.pluginName = 'SwCachePlugin';
    }

    ignoreAssets(assets) {
        this.validateType(this.options.ignore, 'Array', 'Ignore must be an array');
        const ignorePatterns = this.options.ignore || [];

        if (ignorePatterns)
            return (assets.filter(text => !ignorePatterns.some(regex => regex.test(text))));

        return assets;
    }

    validateType(value, type, message) {
        if (!value)
            return;

        const classOfIgnore = toClass.call(value);
        if (!classOfIgnore.includes(type))
            throw new Error(message);
    }

    addAdditionalPaths(additionals, assets) {
        this.validateType(additionals, 'Array', 'Extras must be an array');
        if (!additionals)
            return assets;

        return assets.concat(additionals);
    }

    setPathToAssets(publicPath, assets) {
        const assetGlobs = assets.map(f => URL.resolve(publicPath, f));
        return assetGlobs;
    }

    getCacheTemplate() {
        const filePath = path.join(__dirname, 'template/sw-cache.tmpl');
        return fs.readFileAsync(filePath, 'utf-8');
    }

    writeCacheFile(templateWithData) {
        return function (outputPath) {
            const filePath = path.join(outputPath, '/AssetsManager.js');
            return fs.writeFileAsync(filePath, templateWithData);
        }
    }

    populateTemplate(fileTemplate) {
        return function (data) {
            return new Promise((resolve, reject) => {
                resolve(template(fileTemplate)(data));
            });
        }
    }

    showCacheEntries(log, cacheEntries) {
        log(chalk.blue('Cache entries:'));
        cacheEntries.map((entry) => {
            log(chalk.green(entry));
        });
    }

    getHashesToSave(assets, hash) {
        const noChunks = 2;
        const assetsWithoutChunks = assets.filter(asset => asset.split('.').length === noChunks);
        const hashes = assetsWithoutChunks.reduce((acc, asset) => {
            if (!asset.includes(hash)) {
                const parts = asset.split('.');
                acc.push(parts[0]);
            }
            return acc;
        }, [hash]);
        return hashes;
    }

    arrayToString(arr) {
        const withFormat = arr.map((a) => {
            return '\'' + a + '\'';
        }).join(',');

        return withFormat;
    }

    addOriginPath(_url = '', publicPath = '') {
        const parsedUrl = URL.parse(_url);
        if (parsedUrl.host)
            return parsedUrl.href;

        const _originPath = URL.parse(publicPath);
        const mainUrl = `${_originPath.protocol}//${_originPath.host}`;
        const completeUrl = URL.resolve(mainUrl, _url);
        return completeUrl;
    }

    formatToShow(urls = [], publicPath = '') {
        const _urls = urls.map(url => {
            return this.addOriginPath(url, publicPath);
        });

        return _urls;
    }

    getTemplateCreator(compiler) {
        if(!compiler.hooks){
            return new TemplateCreatorW2(compiler);
        }
        return new TemplateCreatorW4(compiler);
    }

    apply(compiler) {
        let templateCreator = this.getTemplateCreator(compiler);
        const buildSwTemplate = (_compiler, compilation, callback) => {
            const outputPath = _compiler.options.output.path;
            const hash = compilation.hash;
            const publicPath = _compiler.options.output.publicPath;
            const additionals = this.options.include;
            const cacheName = this.options.cacheName;
            const _assets = templateCreator.getAssets();
            const assets = Object.keys(_assets) || [];
            const filteredAssets = this.ignoreAssets(assets);
            const hashesToSave = this.getHashesToSave(filteredAssets, hash);
            const cacheEntries = this.setPathToAssets(publicPath, filteredAssets);
            const cacheEntries_ = this.addAdditionalPaths(additionals, cacheEntries);

            const templateInfo = {
                cacheEntries: this.arrayToString(cacheEntries_),
                cacheName: cacheName,
                hashes: this.arrayToString(hashesToSave)
            }

            const urlsToShow = this.formatToShow(cacheEntries_, publicPath);

            this.getCacheTemplate()
                .then(fileTemplate => this.populateTemplate(fileTemplate)(templateInfo))
                .then(templateWithData => this.writeCacheFile(templateWithData)(outputPath))
                .then(success => { this.showCacheEntries(console.log, urlsToShow) },
                    err => { throw new Error(err) });

            callback();
        };

        templateCreator.createTemplate(buildSwTemplate);
    }
}

module.exports = SwCachePlugin;