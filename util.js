const nodeFetch = require('node-fetch')
const crypto = require('crypto')

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'

/**
 * https://www.cnblogs.com/vipstone/p/5514886.html
 * 作者 王磊
 */
class Aes {
    constructor(key='KA58ZAQ321oobbG8', iv='A1B2C3DEF1G321o8', mode='aes-128-cbc') {
        this.key = key
        this.iv = iv
        this.mode = mode
    }
    /**
     * aes加密
     * @param data 待加密内容
     * @param key 必须为32位私钥
     * @returns {string}
     */
    encryption(data) {
        var clearEncoding = 'utf8';
        var cipherEncoding = 'base64';
        var cipherChunks = [];
        var cipher = crypto.createCipheriv(this.mode, this.key, this.iv);
        cipher.setAutoPadding(true);
        cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
        cipherChunks.push(cipher.final(cipherEncoding));
        return cipherChunks.join('');
    }

    /**
     * aes解密
     * @param data 待解密内容
     * @param key 必须为32位私钥
     * @returns {string}
     */
    decryption(data) {
        if (!data) {
            return "";
        }
        var clearEncoding = 'utf8';
        var cipherEncoding = 'base64';
        var cipherChunks = [];
        var decipher = crypto.createDecipheriv(this.mode, this.key, this.iv);
        decipher.setAutoPadding(true);
        cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
        cipherChunks.push(decipher.final(clearEncoding));
        return cipherChunks.join('');
    }
}

module.exports = {
    fetch(url, config) {
        let headers = (config && config.headers) ? { ...config.headers, 'user-agent': UA } : { 'user-agent': UA }
        return nodeFetch(url, {
            ...config,
            headers
        })
    },
    aes: new Aes(),
    spreadArray(array) {
        let arr = JSON.parse(JSON.stringify(array)),
            result = [],
            index = 0
        while(true) {
            if(arr.length == 0) break
            if(index >= arr.length) index = 0
            if(arr[index].length == 0) {
                arr.splice(index, 1)
                continue
            }
            result.push(arr[index].shift())
            index ++
        }
        return result
    }
}