const cheerio = require('cheerio')
const fetch = require('../util').fetch
const aes = require('../util').aes

module.exports = {
    name: "漫画呗",
    host: "https://m.manhuabei.com",

    async filter(ctx) {
        let html = await (await fetch(`${this.host}/list/`)).text(),
            $ = cheerio.load(html)
        return [
            {
                id: 'type',
                name: '题材',
                data: $('.filter-item:nth-child(1) li').map((index, li) => {
                    return {
                        'id': $(li).children('a').attr('href').match(/\/list\/(.*?)\/?$/)[1],
                        'name': $(li).children('a').text()
                    }
                }).get()
            },
            {
                id: 'status',
                name: '进度',
                data: $('.filter-item:nth-child(3) li').map((index, li) => {
                    return {
                        'id': $(li).children('a').attr('href').match(/\/list\/(.*?)\/?$/)[1],
                        'name': $(li).children('a').text()
                    }
                }).get()
            },
            {
                id: 'area',
                name: '地区',
                data: $('.filter-item:nth-child(4) li').map((index, li) => {
                    return {
                        'id': $(li).children('a').attr('href').match(/\/list\/(.*?)\/?$/)[1],
                        'name': $(li).children('a').text()
                    }
                }).get()
            },
            {
                id: 'order',
                name: '排序',
                default: 'update',
                data: $('.sorter li').map((index, li) => {
                    return {
                        'id': $(li).children('a').attr('href').match(/\/list\/(.*?)\/$/)[1],
                        'name': $(li).children('a').text()
                    }
                }).get()
            },
        ]
    },

    async all(ctx) {
        let query = []
        if(ctx.query.type) query.push(ctx.query.type)
        if(ctx.query.status) query.push(ctx.query.status)
        if(ctx.query.area) query.push(ctx.query.area)
        let order = ctx.query.order ?  ctx.query.order : 'update',
            url = `${this.host}/list${query.length>0 ? '/': ''}${query.join('-')}/${order}/?page=${ctx.query.page ? ctx.query.page : 1}`,
            html = await (await fetch(url)).text(),
            $ = cheerio.load(html)
            console.log(url)
        return $('#comic-items>li').map((index, li) => {
            return {
                id: $(li).children('.txtA').attr('href').match(/\/manhua\/(.+)\//)[1],
                name: $(li).children('.txtA').text(),
                cover: $(li).find('a img').attr('src'),
                lastChapterId: $(li).find('span a').attr('href').match(/\/(\d+)\.html$/)[1],
                lastChapterName: $(li).find('span a').text(),
            }
        }).get()
    },

    async search(ctx) {
        if(!ctx.query.kw) throw new Error('missing parameter')
        let json = await (await fetch(`https://api.manhuabei.com/comic/search?page=${ctx.query.page ? ctx.query.page : 1}`, {
                method: 'POST',
                body: JSON.stringify({
                    keywords: ctx.query.kw,
                })
            })).json()
        return json.items.map(item => {
            return {
                id: item.slug,
                name: item.name,
                cover: item.coverUrl,
                lastChapterId: item.last_chapter_id,
                lastChapterName: item.last_chapter_name,
            }
        })
    },

    async item(ctx) {
        if(!ctx.query.id) throw new Error('missing parameter')
        let html = await (await fetch(`${this.host}/manhua/${ctx.query.id}/`)).text(),
            $ = cheerio.load(html)
        return {
            id: ctx.query.id,
            name: $('#comicName').text(),
            cover: $('#Cover').find('img').attr('src'),
            author: $('.sub_r p:nth-child(1)').text().match(/^\s+(\S+)\s+$/)[1].split(','),
            type: $('.sub_r p:nth-child(2) a').map((index, a) => $(a).text()).get(),
            area: $('.sub_r p:nth-child(3) a').eq(1).text(),
            status: $('.sub_r p:nth-child(3) a').eq(2).text(),
            updateTime: $('.date').text(),
            desc: $('#full-des').text() ? $('#full-des').text() : $('#simple-des').text(),
            chapters: $('#list_block>div').map((index, div) => {
                return {
                    title: $(div).find('.Title').text(),
                    data: $(div).find('li a').map((index, a) => {
                        return {
                            id: $(a).attr('href').match(/\/(\d+)\.html$/)[1],
                            name: $(a).find('span:nth-child(1)').text()
                        }
                    }).get()
                }
            }).get()
        }
    },

    async image(ctx) {
        if(!ctx.query.id || !ctx.query.chapterId) throw new Error('missing parameter')
        let html = await (await fetch(`${this.host}/manhua/${ctx.query.id}/${ctx.query.chapterId}.html`)).text(),
            $ = cheerio.load(html),
            chapterName = $('.BarTit').text().match(/^\s+(\S+)\s+$/)[1],
            match = html.match(/var chapterImages = "(.*?)";var chapterPath = "(.*?)";/),
            configHtml = await (await fetch(`${this.host}/js/config.js`)).text(),
            imageHost = configHtml.match(/"自动选择","domain":\["(.+?)"\]/)[1],
            prev = JSON.parse(html.match(/var prevChapterData = (\{.*?\});/)[1]),
            next = JSON.parse(html.match(/var nextChapterData = (\{.*?\});/)[1]),
            cover = html.match(/var pageImage = "(.*?)";/)[1]
        return {
            id: ctx.query.id,
            name: $('head meta[name=keywords]').attr('content').replace(chapterName, ''),
            cover,
            chapterId: ctx.query.chapterId,
            chapterName,
            images: aes.decryption(match[1]).match(/"(.+?)"/g).map(value => {
                value = value.replace(/"/g,'')
                if(value.includes('images.dmzj.com')) return value
                else return imageHost + '/' + match[2] + value
            }),
            prev: {
                id: prev.id,
                name: prev.name
            },
            next: {
                id: next.id,
                name: next.name
            },
        }
    },
}