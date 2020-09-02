const fs = require('fs')
const spreadArray = require('../util').spreadArray

let files = fs.readdirSync(__dirname).filter(f => f != 'all.js').map(f => f.replace('.js',''))

var filterData

module.exports = {
    async filter(ctx) {
        if(filterData) return filterData
        let modules = files.map(f => require(`./${f}`)),
            data = await Promise.all(modules.map(module => module.filter(ctx).catch(err => {console.log(err)})))
        data = data.map((d, index) => {
            if(!d) d = []
            d.unshift({
                id: 'origin',
                name: '漫源',
                data: files.map((name, i) => ({
                    id: name,
                    name: modules[i].name
                }))
            })
            return d
        })
        return filterData = data
    },
    async search(ctx) {
        let modules = files.map(f => require(`./${f}`)),
            data = await Promise.all(modules.map(module => module.search(ctx).catch(err => {console.log(err)})))
        data = data.map((d, index) => {
            if(!d) return
            return d.map(item => {
                return {
                    ...item,
                    originId: files[index],
                    originName: modules[index].name
                }
            })
        })
        return spreadArray(data).filter(Boolean)
    },
}