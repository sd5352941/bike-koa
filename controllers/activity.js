// const db = new Monk('localhost:27017/runoob').get('activityList');
const db = require('../mongo').db.get('activityList')//链接到活动数据库
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs')
const path = require('path')


/**
 * 获取活动列表
 * @param ctx
 */

var getActivity = async (ctx, next) => {
    // 获取翻页信息
    let page = {
        limit: Number(ctx.query.pageSize),
        skip: Number(ctx.query.pageNum)
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
        // 数据处理
        const data = {}
        data['esInformation'] = res[0]
        data['mapPoint'] = res[0].mapPoint
        ctx.response.body = {
            code: 2000,
            result: data,
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
    await db.insert(ctx.request.body).then(res => {
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

/**
 * 活动封面上传
 * @param ctx
 */

var uploadIMG = async (ctx, next) => {
    const file = ctx.request.files.file
    // 创建可读流
    const reader = fs.createReadStream(file.path);
    // 更改存放文件名
    const fileName = new Buffer(file.name + new Date().getTime()).toString('base64')

    let filePath = path.join(__dirname, '../public/upload/activityCover/') + fileName + `cover.jpg`;
    const upStream = fs.createWriteStream(filePath);
    reader.pipe(upStream);
    // 图片存放地址
    let imgPath = ctx.request.origin + '/upload/activityCover/' + fileName + `cover.jpg`
    ctx.response.body = {
        code: 2000,
        path: imgPath,
        msg:'添加图片成功'
    }
}


module.exports = {
    'GET /activity/query': getActivity,
    'POST /activity/add': addActivity,
    'GET /activity/detail': queryDetail,
    'POST /activity/uploadIMG': uploadIMG,
}
