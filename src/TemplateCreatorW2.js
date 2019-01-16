export default class TemplateCreatorW2 {
  constructor (compiler) {
    this._compiler = compiler
    this._compilation = null
  }
  getAssets () {
    return this._compilation.compilation.assets
  }

  createTemplate (fn) {
    this._compiler.plugin('done', (stats) => {
      this._compilation = stats
      const callback = () => { }
      fn(this._compiler, stats, callback)
    })
  }
}
