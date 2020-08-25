const router = require('koa-router')()
const fs = require('fs')
const path = require('path')

let files = fs.readdirSync(path.join(__dirname, 'controllers'))
for(let file of files) {
    let name = file.replace('.js','')
    let controller = require(`./controllers/${file}`)
    for(let c in controller) {
        if(typeof controller[c] === 'function') {
            router.get(`/${name}/${c}`, async ctx => {
                try {
                    ctx.body = {
                        code: 0,
                        data: await controller[c](ctx)
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