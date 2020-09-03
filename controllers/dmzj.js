const cheerio = require('cheerio')
const fetch = require('../util').fetch

module.exports = {
    name: "动漫之家",
    host: "https://m.dmzj.com",

    async filter(ctx) {
        let html = await (await fetch(`${this.host}/classify.html`)).text(),
            $ = cheerio.load(html)
        return [
            {
                id: 'type',
                name: '题材',
                data: $('#classCon ul:nth-child(1) li').map((index, li) => {
                    return {
                        'id': String(index),
                        'name': $(li).children('a').text()
                    }
                }).get()
            },
            {
                id: 'status',
                name: '进度',
                data: $('#classCon ul:nth-child(3) li').map((index, li) => {
                    return {
                        'id': String(index),
                        'name': $(li).children('a').text()
                    }
                }).get()
            },
            {
                id: 'area',
                name: '地区',
                data: $('#classCon ul:nth-child(4) li').map((index, li) => {
                    return {
                        'id': String(index),
                        'name': $(li).children('a').text()
                    }
                }).get()
            },
            {
                id: 'order',
                name: '排序',
                default: '0',
                data: $('.Sub_H2 a').map((index, a) => {
                    return {
                        'id': $(a).attr('onclick').match(/sortClickAction\((\d+),/)[1],
                        'name': $(a).text()
                    }
                }).get()
            },
        ]
    },

    async all(ctx) {
        let type = ctx.query.type ? ctx.query.type : '0',
            status = ctx.query.status ? ctx.query.status : '0',
            area = ctx.query.area ?  ctx.query.area : '0',
            order = ctx.query.order ?  ctx.query.order : '0',
            page = ctx.query.page ?  ctx.query.page-0 - 1 : '0',
            url = `${this.host}/classify/${type}-0-${status}-${area}-${order}-${page}.json`,
            html = await (await fetch(url)).json()
        return html.map(item => {
            return {
                id: item.id,
                name: item.name,
                cover: 'https://images.dmzj.com/' + item.cover,
                lastChapterId: item.last_update_chapter_id,
                lastChapterName: item.last_update_chapter_name,
            }
        })
    },

    async search(ctx) {
        if(!ctx.query.kw) throw new Error('missing parameter')
        if(ctx.query.page && ctx.query.page > 1) return []
        let html = await (await fetch(`${this.host}/search/${encodeURIComponent(ctx.query.kw)}.html`)).text(),
            match = html.match(/var serchArry=(\[.+\])/)
        if(match) {
            let data = JSON.parse(match[1])
            return data.map(item => {
                return {
                    id: item.id,
                    name: item.name,
                    cover: 'https://images.dmzj.com/' + item.cover,
                    lastChapterId: item.last_update_chapter_id,
                    lastChapterName: item.last_update_chapter_name,
                }
            })
        }else return []
    },

    async item(ctx) {
        if(!ctx.query.id) throw new Error('missing parameter')
        let html = await (await fetch(`${this.host}/info/${ctx.query.id}.html`)).text(),
            $ = cheerio.load(html)
        return {
            id: ctx.query.id,
            name: $('#comicName').text(),
            cover: $('#Cover').find('img').attr('src'),
            author: $('.sub_r p:nth-child(1)').find('a').map((index, a) => $(a).text()).get(),
            type: $('.sub_r p:nth-child(2) a').map((index, a) => $(a).text()).get(),
            area: $('.sub_r p:nth-child(3) a').eq(1).text(),
            status: $('.sub_r p:nth-child(3) a').eq(2).text(),
            updateTime: $('.date').text(),
            desc: $('head meta[name=Description]').attr('content').match(/漫画介绍：(.+)/)[1],
            chapters: JSON.parse(html.match(/initIntroData\((\[.*\])\);/)[1]).map(item => {
                return {
                    title: item.title,
                    data: item.data.map(d => {
                        return {
                            id: d.id,
                            name: d.chapter_name
                        }
                    })
                }
            })
        }
    },

    async image(ctx) {
        if(!ctx.query.id || !ctx.query.chapterId) throw new Error('missing parameter')
        let html = await (await fetch(`${this.host}/view/${ctx.query.id}/${ctx.query.chapterId}.html`)).text(),
            match = html.match(/initData\((\{.*\}), "(.*?)", "(.*?)"\);/),
            data = JSON.parse(match[1])
        return {
            id: ctx.query.id,
            name: match[2],
            cover: 'https://images.dmzj.com/' + match[3],
            data,
            chapterId: ctx.query.chapterId,
            chapterName: data.chapter_name,
            images: data.page_url,
            prev: {
                id: data.prev_chap_id ? data.prev_chap_id : null
            },
            next: {
                id: data.next_chap_id ? data.next_chap_id : null
            }
        }
    },
}