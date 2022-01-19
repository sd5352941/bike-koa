const Koa = require('koa')
const app = new Koa()
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const fs = require('fs')
const connectHistory = require('connect-history-api-fallback');
var cors = require('koa2-cors')
var files = fs.readdirSync(__dirname + '/controllers');
const koaBody = require('koa-body');
const static = require('koa-static')


var serverAddress = {
    host: 'http://175.168.40.9', // 服务器IP
    port: '3001'
}

/**
 * 文件上传中间件
 */
app.use(koaBody({
    multipart: true,
    formidable: {
        maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
    }
}));


router.use('/*',async (ctx, next) => {
    /**
     *  token解析
     */
    if(ctx.request.method === 'GET') {
        await next()
        return false
    }
    if(ctx.header.token) {
        let time = 7 * 24 * 24 * 60 * 1000
        let tokenStr = new Buffer.from(ctx.header.token,'base64').toString()
        let tokenArr = tokenStr.split(',')
        let sessionTime = tokenArr[1] + time


        if(Date.parse(new Date()) > sessionTime) {
            ctx.response.body = {
                code: 4002,
                msg: '登陆已过期，请重新登录'
            }
        } else {
            await next()
        }
    } else {
        await next()
    }
})

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




//vue-router mode history
// app.use(() => {
//     const middleware = connectHistory();
//     const noop = ()  => {
//
//     };
//     return async (ctx, next)=> {
//         middleware(ctx, null, noop);
//         await next();
//     };
// });


/**
 * 导入第三方库
 */
app.use(cors())
app.use(bodyParser()) // post body解析
app.use(router.routes()).use(router.allowedMethods()); //路由
app.use(static('public'))  // 将public设置为静态可访问文件





// x-respogjgknse-time

// app.use(async (ctx, next) => {
//     const start = Date.now();
//     await next();
//     const ms = Date.now() - start;
//     ctx.set('X-Response-Time', `${ms}ms`);
// });


const server = app.listen(3001 )

