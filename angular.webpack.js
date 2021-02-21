/**
 * Custom angular webpack configuration
 */

module.exports = {
    node: {
        fs: "empty"
     },

     externals: {
        'puppeteer-core': 'require("puppeteer-core")'
      },
    target:'electron-renderer'
}