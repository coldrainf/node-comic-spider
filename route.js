const router = require('koa-router')()
const fs = require('fs')
const path = require('path')

let files = fs.readdirSync(path.join(__dirname, 'controllers'))

let addOrigin = (item, originId, originName) => {
    if(!item.originId) {
        item.originId = originId
        item.originName = originName
    }
}

for(let file of files) {
    let name = file.replace('.js','')
    let controller = require(`./controllers/${file}`)
    for(let c in controller) {
        if(typeof controller[c] === 'function') {
            router.get(`/${name}/${c}`, async ctx => {
                try {
                    let data = await controller[c](ctx)
                    if(name != 'all') {
                        if(Array.isArray(data)) data.map(item => addOrigin(item, name, controller.name))
                        else addOrigin(data, name, controller.name)
                    }
                    ctx.body = {
                        code: 0,
                        data
                    }
                }catch(err) {
                    console.log(err)
                    ctx.body = {
                        code: 1
                    }
                }
            })
        }

    }
}

module.exports = app => {
    app.use(router.routes())
}