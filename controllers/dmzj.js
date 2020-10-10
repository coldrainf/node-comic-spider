const cheerio = require('cheerio')
const fetch = require('../util').fetch

module.exports = {
    name: "动漫之家",
    host: "https://m.dmzj.com",
    apiHost: "https://api.m.dmzj.com",
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
            url = `${this.apiHost}/classify/${type}-0-${status}-${area}-${order}-${page}.json`,
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
        let data = await (await fetch(`${this.apiHost}/search/${encodeURIComponent(ctx.query.kw)}`)).json()
        return data.map(item => {
            return {
                id: item.id,
                name: item.name,
                cover: 'https://images.dmzj.com/' + item.cover,
                lastChapterId: item.last_update_chapter_id,
                lastChapterName: item.last_update_chapter_name,
            }
        })
    },

    async item(ctx) {
        if(!ctx.query.id) throw new Error('missing parameter')
        let data = await (await fetch(`${this.apiHost}/info/${ctx.query.id}.html`)).json(),
            comic = data.comic,
            date = new Date(comic.last_updatetime*1000)
        return {
            id: ctx.query.id,
            name: comic.name,
            cover: comic.cover,
            author: comic.authors.split('/'),
            type: comic.types.split('/'),
            area: comic.zone,
            status: comic.status,
            updateTime: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            desc: comic.introduction,
            chapters: JSON.parse(data.chapter_json).map(item => {
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
        let data = await (await fetch(`${this.apiHost}/comic/chapter/${ctx.query.id}/${ctx.query.chapterId}.html`)).json(),
            chapter = data.chapter
        return {
            id: ctx.query.id,
            name: data.comic_name,
            cover: 'https://images.dmzj.com/' + data.comic_cover,
            chapterId: ctx.query.chapterId,
            chapterName: chapter.chapter_name,
            images: chapter.page_url,
            prev: {
                id: chapter.prev_chap_id ? chapter.prev_chap_id : null
            },
            next: {
                id: chapter.next_chap_id ? chapter.next_chap_id : null
            }
        }
    },
}