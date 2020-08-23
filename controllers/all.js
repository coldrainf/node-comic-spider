const fs = require('fs')
const originData = require('../data')
const spreadArray = require('../util').spreadArray

let files = fs.readdirSync(__dirname).filter(f => f != 'all.js').map(f => f.replace('.js',''))

module.exports = {
    async search(ctx) {
        let searchFuncs = files.map(f => require(`./${f}`).search),
            data = await Promise.all(searchFuncs.map(func => func(ctx).catch(err => {console.log(err)})))
        data = data.map((d, index) => {
            return d.map(item => {
                return {
                    ...item,
                    originId: files[index],
                    originName: originData[files[index]].name
                }
            })
        })
        return spreadArray(data)
    },
}