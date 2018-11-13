const Monk = require('monk')
const db = new Monk('localhost:27017/runoob').get('activityList');//链接到活动数据库


/**
 * 获取活动列表
 * @param ctx
 */

var getActivity = async (ctx, next) => {
    await db.find({}).then(res => {
        ctx.response.body = {
            code: 2000,
            result: res
        }
    })
    console.log('查询成功')
}

/**
 * 获取详情
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */

var queryDetail = async (ctx, next) => {
    var parmas = {
        _id: ObjectId(ctx.params.id)
    }
    await db.find(parmas).then(res => {
        ctx.response.body = {
            code: 2000,
            result: res
        }
    })
    console.log('查询成功')
}

/**
 * 活动添加
 * @param ctx
 */

var addActivity = async (ctx, next) => {
    db.insert(ctx.request.body).then(res => {
        ctx.response.body = {
            code: 2000,
            result: res
        }
    })
    console.log('添加活动成功')
}


module.exports = {
    'GET /activity/query': getActivity,
    'POST /activity/add': addActivity,
    'GET /activity/detail': queryDetail,
}