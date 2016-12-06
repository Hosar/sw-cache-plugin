import path from 'path';
import Promise from 'bluebird';
import template from 'lodash.template';
import fs from 'fs';
import URL from 'url';
import $debug from 'debug';
import chalk from 'chalk';


Promise.promisifyAll(fs);
const debug = $debug('app');
             
const toClass = {}.toString;           

class WebpackSwCache {
    constructor(options) {
        this.options = {
            ...options,
        }        
    }

    ignoreAssets(assets){
        this.validateType(this.options.ignore,'Array','Ignore must be an array');
        const ignorePatterns = this.options.ignore || [];
        
        if(ignorePatterns)
            return(assets.filter(text => !ignorePatterns.some(regex => regex.test(text))));

        return assets;        
    }

    validateType(value,type,message){        
        if(!value)
            return;

        const classOfIgnore = toClass.call(value);
        if(!classOfIgnore.includes(type))
            throw new Error(message);
    }

    addAdditionalPaths(additionals, assets){    
        this.validateType(additionals,'Array','Extras must be an array');
        if(!additionals)
            return assets;

        return assets.concat(additionals);
    }

    setPathToAssets(publicPath, assets){
        const assetGlobs = assets.map(f => URL.resolve(publicPath,f));
        return assetGlobs;
    }

    getCacheTemplate(){
        const filePath = path.join(__dirname,'template/sw-cache.tmpl');
        return fs.readFileAsync(filePath,'utf-8');
    }

    writeCacheFile(templateWithData){
        return function(outputPath){
            const filePath = path.join(outputPath,'/AssetsManager.js');
            return fs.writeFileAsync(filePath,templateWithData);
        }
    }

    populateTemplate(fileTemplate) {        
        return function(data) {
            return new Promise((resolve, reject) => {                
                resolve(template(fileTemplate)(data));
            });
        }        
    }

    showCacheEntries(log,cacheEntries){        
        log(chalk.blue('Cache entries:'));
        cacheEntries.map((entry) => {
            log(chalk.green(entry));
        });
    }   

    getHashesToSave(assets,hash){
        const hashes = assets.reduce((acc,asset) => {            
            if(!asset.includes(hash)){
                const parts = asset.split('.');
                acc.push(parts[0]);
            }
            return acc;
        },[hash]);
        return hashes;
    }

    arrayToString(arr){
        const withFormat = arr.map((a) => {
            return '\'' + a + '\'';
        }).join(',');

        return withFormat;
    }

    apply(compiler) {

        compiler.plugin('done', (stats) => {
            // get the output path specified in webpack config
            const outputPath = compiler.options.output.path;
            const hash = stats.hash;
            const publicPath = compiler.options.output.publicPath;
            const additionals = this.options.include;
            const cacheName = this.options.cacheName;
            const assets = Object.keys(stats.compilation.assets) || [];
            const filteredAssets = this.ignoreAssets(assets);
            const hashesToSave = this.getHashesToSave(filteredAssets,hash);
            const cacheEntries = this.setPathToAssets(publicPath,filteredAssets);
            const cacheEntries_ = this.addAdditionalPaths(additionals,cacheEntries);

            const templateInfo = {
                cacheEntries:this.arrayToString(cacheEntries_),
                cacheName:cacheName,
                hashes:this.arrayToString(hashesToSave)
            }
            
            this.getCacheTemplate()
                .then(fileTemplate => this.populateTemplate(fileTemplate)(templateInfo))
                .then(templateWithData => this.writeCacheFile(templateWithData)(outputPath))
                .then(success => {this.showCacheEntries(console.log,cacheEntries_)},
                      err => {throw new Error(err)});
        });
    }
}

module.exports = WebpackSwCache;