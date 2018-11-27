const Koa = require('koa')
const app = new Koa()
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const fs = require('fs')
var cors = require('koa2-cors')
var files = fs.readdirSync(__dirname + '/controllers');


/**
 * router动态加入cantrollers js文件
 */


var js_files = files.filter((f) => {
    return f.endsWith('.js');
});

for (let file of js_files) {
    let mapping = require(__dirname + '/controllers/' + file)
    for (let url in mapping) {
        if (url.startsWith('GET')) {
            let path = url.substring(4)
            router.get(path,mapping[url])
        } else if(url.startsWith('POST')) {
            let path = url.substring(5)
            router.post(path,mapping[url])
        }else {
            console.log('invalid url: ${url}')
        }
    }
}


/**
 * 导入第三方库
 */
app.use(cors())
app.use(bodyParser())
app.use(router.routes());


// x-respogjgknse-time

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});


app.listen(3001);