const Monk = require('monk')
const db = new Monk('localhost:27017/runoob').get('activityList');//链接到活动数据库
var ObjectId = require('mongodb').ObjectID;


/**
 * 获取活动列表
 * @param ctx
 */

var getActivity = async (ctx, next) => {
    // 获取翻页信息
    let page = {
        limit: Number(ctx.query.pageSize),
        skip: (ctx.query.pageNum - 1) * ctx.query.pageSize
    }
    await db.find({}, page).then(res => {
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
 */

var queryDetail = async (ctx, next) => {
    let parmas = {
        _id: ObjectId(ctx.query.id)
    }
    await db.find(parmas).then(res => {
        ctx.response.body = {
            code: 2000,
            result: res,
            msg:'查询活动成功'
        }
    }).catch(err=>{
        ctx.response.body = {
            code: 4000,
            msg:'查询失败,err:' + err
        }
    })
}

/**
 * 活动添加
 * @param ctx
 */

var addActivity = async (ctx, next) => {
    db.insert(ctx.request.body).then(res => {
        ctx.response.body = {
            code: 2000,
            result: res,
            msg:'添加活动成功'
        }
    }).catch(err=>{
        ctx.response.body = {
            code: 4000,
            msg:'添加失败,err:' + err
        }
    })
}


module.exports = {
    'GET /activity/query': getActivity,
    'POST /activity/add': addActivity,
    'GET /activity/detail': queryDetail,
}