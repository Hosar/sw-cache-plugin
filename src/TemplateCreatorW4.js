export default class TemplateCreatorW4 {
  constructor (compiler) {
    this._compiler = compiler
    this._compilation = null
  }
  getAssets () {
    return this._compilation.assets
  }

  createTemplate (fn) {
    this._compiler.hooks.afterEmit.tapAsync({
      name: 'SwCachePlugin'
    }, (compilation, callback) => {
      this._compilation = compilation
      fn(this._compiler, compilation, callback)
    })
  }
}
