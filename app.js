const Koa = require('koa')
const useRoutes = require('./route.js')

const app = new Koa()
useRoutes(app)

app.listen(2200, () => {
    console.log('http://localhost:2200/')
})