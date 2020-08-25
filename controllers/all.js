const fs = require('fs')
const spreadArray = require('../util').spreadArray

let files = fs.readdirSync(__dirname).filter(f => f != 'all.js').map(f => f.replace('.js',''))

module.exports = {
    async search(ctx) {
        let modules = files.map(f => require(`./${f}`)),
            data = await Promise.all(modules.map(module => module.search(ctx).catch(err => {console.log(err)})))
        data = data.map((d, index) => {
            return d.map(item => {
                return {
                    ...item,
                    originId: files[index],
                    originName: modules[index].name
                }
            })
        })
        return spreadArray(data)
    },
}