
var AssetsManager = function() {
    this.cacheName = 'coffeB_Cache'; 
    this.cacheEntries = ['http://localhost:4200/dist/main-398ea0a56a030d6ca0d8.js','http://localhost:4200/'];
    this.hashes = ['398ea0a56a030d6ca0d8'];
};

AssetsManager.prototype.addAllToCache = function() {
    if(!this.cacheName)
        throw new Error('Please provide cacheName in plugin options');
    const ctx = this;

    return caches.open(ctx.cacheName).then(function(cache) {
      Promise.all(
        ctx.cacheEntries.map(function(asset){cache.add(asset)})
      );
    });            
};

AssetsManager.prototype.removeNotInAssets = function() {
    var ctx = this;   
    
     return caches.open(ctx.cacheName).then(function(cache) {
          cache.keys().then(function(keys) {
              return Promise.all(
                keys.filter(function(request){
                  var erase = true;
                  var noErase = false;          
                  return ctx.cacheEntries.indexOf(request.url) >= 0 ? noErase:erase;
                }).map(function(entryToErase){          
                  cache.delete(entryToErase);                                
                })      
              );
          });
      }); 
};

