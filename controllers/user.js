const db = require('../mongo').db.get('userData')//链接到活动数据库
// const ObjectId = require('mongodb').ObjectID;

/**
 * 用户注册
 * @param ctx
 */

var addUser = async (ctx, next) => {
    let params = {username: ctx.request.body.username}
    var body = {}
    await db.find(params).then(async res => {
        if (res.length === 0) {
            let insertData = {
                activities: [],
                ...ctx.request.body
            }
            await db.insert(insertData).then(res => {
                body = {
                    code: 2000,
                    result: res,
                    msg: '注册成功'
                }
            }).catch(err => {
                body = {
                    code: 4000,
                    msg: '注册失败:' + err
                }
            })
        } else {
            body = {
                code: 4000,
                msg: '注册失败:已有相同的账户名'
            }
        }
    })
    ctx.body = body
}

/**
 * 用户登陆
 * @param ctx
 */

var userLogin = async (ctx, next) => {
    let params = {username: ctx.request.body.username}
    await db.find(params).then(async res => {
        if (res.length > 0) {
            if (ctx.request.body.password == res[0].password) {
                ctx.body = {
                    code: 2000,
                    name: res[0].username,
                    // token: res[0]._id.toString(),
                    token: new Buffer.from(res[0]._id.toString()).toString('base64'),
                    msg: '登陆成功'
                }
            }else {
                ctx.body = {
                    code: 4000,
                    msg: '账号或密码错误'
                }
            }
        } else {
            ctx.body = {
                code: 4000,
                msg: '账号或密码错误'
            }
        }
    })
    // console.log(ctx.body)
}

module.exports = {
    'POST /user/add': addUser,
    'POST /user/login': userLogin
}