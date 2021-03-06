// @flow
import path from 'path';
import Promise from 'bluebird';
import template from 'lodash.template';
import fs from 'fs';
import URL from 'url';
import $debug from 'debug';
import chalk from 'chalk';
import { compiler, compilation } from 'webpack';
import TemplateCreatorW4 from './TemplateCreatorW4';
import TemplateCreatorW2 from './TemplateCreatorW2';

const fsAsync: any = Promise.promisifyAll(fs);
const debug = $debug('app');

const toClass = {}.toString;
type UsrOptionsType = {
  cacheName: string,
  ignore: Array<RegExp>,
  include: Array<string>
};

type TemplateInfoType = {
  cacheEntries: string,
  cacheName: string,
  hashes: string
};

class SwCachePlugin {
  options: UsrOptionsType;
  pluginName: string;

  constructor (options: UsrOptionsType): void {
    this.options = {
      ...options,
    }
    this.pluginName = 'SwCachePlugin';
  }

  ignoreAssets(assets: Array<string>): Array<string> {
    this.validateType(this.options.ignore, 'Array', 'Ignore must be an array');
    const ignorePatterns: Array<RegExp> = this.options.ignore || [];

    if (ignorePatterns) {
      const ignore: Array<string> = assets.filter(
        (text: string): boolean => !ignorePatterns.some((regex: RegExp): boolean => regex.test(text))
      )
      return ignore;
    }

    return assets;
  }

  validateType (value: Array<any>, type: string, message: string): void {
    if (!value) {
      return;
    }

    const classOfIgnore = toClass.call(value);
    if (!classOfIgnore.includes(type))
      throw new Error(message);
  }

  addAdditionalPaths (additionals: Array<string>, assets: Array<string>): Array<string> {
    this.validateType(additionals, 'Array', 'Extras must be an array')
    if (!additionals) {
      return assets
    }

    return assets.concat(additionals)
  }

  setPathToAssets(publicPath: string, assets: Array<string>): Array<string> {
    const assetGlobs = assets.map((f: string): string => URL.resolve(publicPath, f));
    return assetGlobs;
  }

  getCacheTemplate(): Promise<string> {
    const filePath = path.join(__dirname, 'template/sw-cache.tmpl');
    return fsAsync.readFileAsync(filePath, 'utf-8');
  }

  writeCacheFile(templateWithData: string): Function {
    return function (outputPath: string): Promise<string> {
      const filePath = path.join(outputPath, '/AssetsManager.js');
      return fsAsync.writeFileAsync(filePath, templateWithData);
    }
  }

  populateTemplate(fileTemplate: string): Function {
    return function (data: TemplateInfoType): Promise<string> {
      return new Promise((resolve: Function, reject: Function): string => {
        return resolve(template(fileTemplate)(data));
      });
    }
  }

  showCacheEntries(log: Function, cacheEntries: Array<string>): void {
    log(chalk.blue('Cache entries:'));
    cacheEntries.map((entry: string): void => {
      log(chalk.green(entry));
    });
  }

  getHashesToSave(assets: Array<string>, hash: string): Array<string> {
    const noChunks = 2;
    const assetsWithoutChunks = assets.filter((asset: string): boolean => asset.split('.').length === noChunks);
    const hashes = assetsWithoutChunks.reduce((acc: Array<string>, asset: string): Array<string> => {
      if (!asset.includes(hash)) {
        const parts = asset.split('.');
        acc.push(parts[0]);
      }
      return acc;
    }, [hash]);
    return hashes;
  }

  arrayToString(arr: Array<string>): string {
    const withFormat = arr.map((a: string): string => {
      return '\'' + a + '\'';
    }).join(',');

    return withFormat;
  }

  addOriginPath(_url: string = '', publicPath: string = ''): string {
    const parsedUrl = URL.parse(_url);
    if (parsedUrl.host)
      return parsedUrl.href;

    const _originPath = URL.parse(publicPath);
    const mainUrl: string = `${_originPath.protocol || ''}//${_originPath.host || ''}`;
    const completeUrl = URL.resolve(mainUrl, _url);
    return completeUrl;
  }

  formatToShow(urls: Array<string> = [], publicPath: string = ''): Array<string> {
    const _urls: Array<string> = urls.map((url: string): string => {
      return this.addOriginPath(url, publicPath);
    });

    return _urls;
  }

  getTemplateCreator(compiler: compiler): TemplateCreatorW2 | TemplateCreatorW4 {
    if (!compiler.hooks) {
      return new TemplateCreatorW2(compiler);
    }
    return new TemplateCreatorW4(compiler);
  }

  apply (compiler: compiler): void {
    let templateCreator = this.getTemplateCreator(compiler);
    const buildSwTemplate = (_compiler: compiler, compilation: compilation, callback: Function): void => {
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

      const templateInfo: TemplateInfoType = {
        cacheEntries: this.arrayToString(cacheEntries_),
        cacheName: cacheName,
        hashes: this.arrayToString(hashesToSave)
      }

      const urlsToShow = this.formatToShow(cacheEntries_, publicPath);

      this.getCacheTemplate()
        .then(
          (fileTemplate: string): Promise<string> => this.populateTemplate(fileTemplate)(templateInfo)
        )
        .then(
          (templateWithData: string): Promise<string> => this.writeCacheFile(templateWithData)(outputPath)
        )
        .then((): Promise<void> => this.showCacheEntries(console.log, urlsToShow))
        .catch((ex: Error): void => {
          chalk.red(ex.message)
          throw new Error(ex.message)
        })
        .then(callback, callback)
    };

    templateCreator.createTemplate(buildSwTemplate);
  }
}

module.exports = SwCachePlugin;
