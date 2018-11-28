const db = require('../mongo').db.get('userData')//链接到活动数据库
const ObjectId = require('mongodb').ObjectID;

/**
 * 用户注册
 * @param ctx
 */

var addUser = async (ctx, next) => {
    let params = {userName: ctx.request.body.userName}
    db.find(params).then(res => {
        if (res.length === 0) {
            db.insert(ctx.request.body).then(res => {
                console.log(res)
                ctx.response.body = {
                    code: 2000,
                    result: res,
                    msg: '注册成功'
                }
            }).catch(err => {
                console.log(err)
                ctx.response.body = {
                    code: 4000,
                    msg: '注册失败,err:' + err
                }
            })
        }
    })
}

/**
 * 用户登陆
 * @param ctx
 */

var userLogin = async (ctx, next) => {
    let params = {userName: ctx.request.body.userName}
    db.find(params).then(res => {
        if (res.data.length > 1) {

        }
    })
}

module.exports = {
    'POST /user/add': addUser,
    'POST /user/login' : userLogin
}