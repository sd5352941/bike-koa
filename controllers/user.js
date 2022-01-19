const db = require('../mongo').db.get('userData')//链接到活动数据库
const ObjectId = require('mongodb').ObjectID;

function getToken(id) {
    let idStr = id.toString()
    let token = new Buffer.from(idStr + ',' + Date.parse(new Date())).toString('base64')
    return token
}

function getObjId(id) {
    let tokenStr = new Buffer.from(id,'base64').toString()
    let tokenArr = tokenStr.split(',')
    return ObjectId(tokenArr[0])}

/**
 * 获取用户信息
 * @param ctx
 */
var getUserData = async (ctx,next)=> {
    let params = {
        _id: getObjId(ctx.header.token)
    }
    if(ctx.query.id) params = {_id: ObjectId(ctx.query.id)}
    await db.find(params).then(res=> {
        delete res[0].password
        ctx.body = {
            code: 2000,
            result: res[0],
            msg: '查询成功'
        }
    }).catch(err=> {
        ctx.body = {
            code: 4000,
            err,
            msg: '查询用户信息失败'
        }
    })
}

/**
 * 保存用户信息
 * @param ctx
 */
var SaveUserData = async (ctx,next)=> {
    let commitUserData = ctx.request.body
    let params = {
        _id: getObjId(ctx.header.token)
    }
    if(ctx.query.id) params = {_id: ObjectId(ctx.query.id)}
    await db.find(params).then(async res=> {
        let userData = res[0]
        let msg = ''
        let code = 0
        for(let key in commitUserData) {
            userData[key] = commitUserData[key]
        }
        await db.update(params,userData).then(res=> {
            code = 2000
            msg = '修改成功'

        }).catch(err=> {
            code = 4000
            msg = '修改失败,err:' + err
        })
        ctx.body = {
            code,
            msg
        }
    }).catch(err=> {
        ctx.body = {
            code: 4000,
            err,
            msg: '查询用户信息失败'
        }
    })
}

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
                nickName: ctx.request.body.username,
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
                    portrait: res[0].portrait,
                    // token: res[0.]._id.toString(),
                    token: getToken(res[0]._id) ,
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

/**
 * 获取用户活动列表
 */

var getUserActivities = async (ctx,next)=> {
    let params = {
        _id: getObjId(ctx.header.token)
    }
    await db.find(params).then(res=> {
        ctx.response.body = {
            code: 2000,
            data: res[0].activities,
            msg: '查询用户活动列表成功'
        }
    }).catch(err=> {
        ctx.response.body = {
            code: 4000,
            msg: '查询用户活动列表失败',
            err
        }
    })
}

var saveHomePage = async (ctx,next)=> {
    let params = {
        _id: getObjId(ctx.header.token)
    }
    await db.update(params,{$set:{homePage:ctx.request.body.homePage }}).then(res=> {
        ctx.response.body = {
            code: 2000,
            msg: '修改成功',
        }
    }).catch(err=> {
        ctx.response.body = {
            code: 4000,
            msg: '保存失败',
            err
        }
    })
}

module.exports = {
    'POST /user/homePage': saveHomePage,
    'POST /user/add': addUser,
    'POST /user/login': userLogin,
    'GET /user/activities': getUserActivities,
    'GET /user/getData': getUserData,
    "POST /user/save": SaveUserData,
}