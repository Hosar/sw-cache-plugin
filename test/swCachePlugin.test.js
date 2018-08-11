import test from 'ava';
import webpack from 'webpack';
import path from 'path';
import SwCachePlugin from '../src/index.js';
import $debug from 'debug';
import sinon from 'sinon';
import fs from 'fs';
import { webpack4Assets } from './stubs/asset';

const debug = $debug('test');

const webpackConfig = () => {
  const config = {
    context: __dirname,
    entry: {
      main: path.resolve(__dirname, 'stubs/entry'),
    },
    output: {
      path: path.resolve(__dirname, 'tmp'),
      filename: '[name]-[hash].js',
      publicPath: 'http://localhost:4200/dist/'
    },    
  };

  return config;
};

const fsExists = (filePath) => new Promise(
  resolve => fs.access(filePath, err => resolve(!err))
);

const pluginOptions = {
  ignore:[/.*\.css$/,/boot.*/],
  cacheName:'coffeB_Cache',
  include:['http://localhost:4200/']
}

const testAssets = ['swRegistry-b8305b0556d22425eb92.js',
                    'e02a995e6786d8aa55ee397094f88d16.css',
                    '1b2bcaeebdec4584386bdcc241897209.css',
                            'app-b8305b0556d22425eb92.js',
                      'bootsInit-b8305b0556d22425eb92.js',
                      'bootswatch-b8305b0556d22425eb92.js',
                      'bootstrap-b8305b0556d22425eb92.js',
                    'bdc6ba656c409a66b40106f307c30f8d.css',
                      'coffeeb_sw-b8305b0556d22425eb92.js'];
  

test('should filter the assets according to ignore', t => {
  const plugin = new SwCachePlugin(pluginOptions);  
                      
  const filteredAssets = plugin.ignoreAssets(testAssets);
  t.is(filteredAssets.length,3);
});

test('should set the output path to all the assets', t => {
  const swRegistryExpected = 'http://localhost:4200/dist/swRegistry-b8305b0556d22425eb92.js';
  const appExpected = 'http://localhost:4200/dist/app-b8305b0556d22425eb92.js';
  const plugin = new SwCachePlugin(pluginOptions);
  const publicPath = 'http://localhost:4200/dist/';
  const assetsWithPath = plugin.setPathToAssets(publicPath,testAssets);
  
  t.is(typeof assetsWithPath,'object');  
  t.is(assetsWithPath[3],appExpected);
  t.is(assetsWithPath[0],swRegistryExpected);
  t.is(assetsWithPath.length,9);

});

test('should thow an exception if options is provided an is not an array', t => {  
  const plugin = new SwCachePlugin({ignore:/.*$/});  
  
  const error = t.throws(() => {
      plugin.ignoreAssets([]);      
  }, Error);

  t.is(error.message, 'Ignore must be an array');
});

test('should add additional paths to assets', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const origin = ['http://localhost:4200/','http://localhost:4200/dist'];
  const assets = 
  ["http://localhost:4200/swRegistry-b8305b0556d22425eb92.js", 
  "http://localhost:4200/app-b8305b0556d22425eb92.js"];
  const assetsExpected = 
  ["http://localhost:4200/swRegistry-b8305b0556d22425eb92.js",
  "http://localhost:4200/app-b8305b0556d22425eb92.js", 
  "http://localhost:4200/","http://localhost:4200/dist"];

  const assetsActual = plugin.addAdditionalPaths(origin,assets);
  
  t.is(assetsActual.length,4);  
  t.deepEqual(assetsExpected,assetsActual);
});

test('given a text instead of an array for additional paths should throw an exception', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const additionals = 'http://localhost:4200/';

  const error = t.throws(() => {
      plugin.addAdditionalPaths(additionals,[]);      
  }, Error);

  t.is(error.message, 'Extras must be an array');

});

test('should show the list of assets to be cached', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const titlePlusEntries = 5;
  const cacheEntries = 
  ["'http://localhost:4200/swRegistry-b8305b0556d22425eb92.js'",
  "'http://localhost:4200/app-b8305b0556d22425eb92.js',", 
  "'http://localhost:4200/'",
  "'http://localhost:4200/dist'"];
  const log = sinon.spy();

  plugin.showCacheEntries(log,cacheEntries);
  
  t.is(log.callCount,titlePlusEntries);

});

test('should get the hashes that identify the request to save in cache', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const hash = '0c9fe69fceef3af0289f';
  const assets = ['swRegistry-0c9fe69fceef3af0289f.js',
                  '1b2bcaeebdec4584386bdcc241897209.css',
                  'coffeeb_sw-0c9fe69fceef3af0289f.js',
                  'app-0c9fe69fceef3af0289f.js',
                  'e02a995e6786d8aa55ee397094f88d16.css'];
  const hashesExpected = ["0c9fe69fceef3af0289f",
                          "1b2bcaeebdec4584386bdcc241897209",
                          "e02a995e6786d8aa55ee397094f88d16"];

  const hashesActual = plugin.getHashesToSave(assets,hash);
  t.deepEqual(hashesActual,hashesExpected);
});

test('should get the hashes that identify the request to save in cache, for webpack4', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const hash = '0c9fe69fceef3af0289f';
  const hashesExpected = [ '0c9fe69fceef3af0289f',
                           'app-54331a3c4d65ab4c39e1',
                           'sw-54331a3c4d65ab4c39e1',
                           'swRegistry-54331a3c4d65ab4c39e1',
                           'vendor-54331a3c4d65ab4c39e1' ];

  const hashesActual = plugin.getHashesToSave(webpack4Assets, hash);
  t.deepEqual(hashesActual,hashesExpected);
});

test('given an Array should format as string with apostrophes', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const arr = ['0c9fe69fceef3af0289f',
               '1b2bcaeebdec4584386bdcc241897209',
               'e02a995e6786d8aa55ee397094f88d16'];
  const strExpected = "'0c9fe69fceef3af0289f','1b2bcaeebdec4584386bdcc241897209','e02a995e6786d8aa55ee397094f88d16'";
  const str = plugin.arrayToString(arr);

  t.is(str,strExpected);
});

test('given additionals URI add the origin path to show in the cache entries final report', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const additional = '/';
  const expected = 'http://localhost:4200/';
  const publicPath = 'http://localhost:4200/dist/';
  const withPath = plugin.addOriginPath(additional,publicPath);

  t.deepEqual(withPath,expected);
});

test('given additionals URI with host format should return the same URI', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const additional = 'http://localhost:4200/find';
  const expected = 'http://localhost:4200/find';
  const publicPath = 'http://localhost:4200/dist/';
  const withPath = plugin.addOriginPath(additional,publicPath);

  t.deepEqual(withPath,expected);
});

test('given an array of cache entries should format to show the final entries on cache', t => {
  const plugin = new SwCachePlugin(pluginOptions);
  const cacheEntries = ['http://localhost:4200/app-b8305b0556d22425eb92.js','/find'];
  const expected = ['http://localhost:4200/app-b8305b0556d22425eb92.js','http://localhost:4200/find'];
  const publicPath = 'http://localhost:4200/dist/';
  const urlsToShowActual = plugin.formatToShow(cacheEntries,publicPath);

  t.deepEqual(expected,urlsToShowActual);
});

test.cb('should generate AssetsManager file', t => {  
  const compiler = webpack(webpackConfig());
  const config = webpackConfig();  

  const plugin = new SwCachePlugin(pluginOptions);     
  plugin.apply(compiler);

  compiler.run((err, stats) => {
    t.ifError(err, `compiler error: ${err}`);
    t.is(typeof stats, 'object');
    const fPath = path.resolve(__dirname, 'tmp/service-worker.js');    
    t.end();

    fsExists(fPath).then(e => {      
      t.truthy(e);
      t.end();      
    });
    
  });
});