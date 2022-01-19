// const db = new Monk('localhost:27017/runoob').get('activityList');
const db = require('../mongo').db.get('activityList')//链接到活动数据库
const dbUser = require('../mongo').db.get('userData') //链接到用户数据库
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs')
const path = require('path')

function getObjId(id,type) {
    let tokenStr = new Buffer.from(id,'base64').toString()
    let tokenArr = tokenStr.split(',')
    let getId
    type === 'string' ? getId = tokenArr[0] : ObjectId(tokenArr[0])
    return getId
}



function getActivityState(data) {
    let current = new Date().getTime()
    if(current < data.gatheringTime) {
        if(data.people> 0 && data.people == data.signUpUser.length) {
            return 'full'
        } else {
            return 'ongoing'
        }
    } else {
        return 'expire'
    }
}

/**
 * 获取活动列表
 * @param ctx
 */

function getQuery(item) {
    let current = new Date().getTime()
    let query = {
        userId: item.userId || '',
        '$or': [
            {title: {'$regex' : item.title || ''}},
            {address:{'$regex' : item.address || ''}}
        ],
        gatheringTime: ''
    }
    if(item.state) {
        let stateStr = item.state.split(',')
        if(!stateStr.includes('full')) {
            query['isFull'] = {
                '$not' : /full/
            }
        }
        if(!stateStr.includes('expire')) {
            query['gatheringTime'] = {
                '$not': {'$lt': current}
            }
        }
    }

    return query
}


const getActivity = async (ctx, next) => {
    //查询条件
    let query = getQuery(ctx.query)
    // 获取翻页信息

    let page = {
        sort: {gatheringTime: -1},
        limit: Number(ctx.query.pageSize),
        skip: Number(ctx.query.pageNum),
    }
    for(let key in query) {
        if(!query[key]) delete query[key]
    }
    // await db.find(query, page).then(res => {
    //     for(let item of res) {
    //         item['state'] = getActivityState(item)
    //     }
    //     ctx.response.body = {
    //         code: 2000,
    //         result: res
    //     }
    // })
    await db.aggregate([
        {'$match': query},
        {'$lookup': {
                from: 'userData',
                localField: 'creator',
                foreignField: 'username',
                as: 'userInfo'
            }
        },
        {$skip:page.skip},
        {$limit:page.limit},
        {$sort:page.sort}
    ]).then(res=> {
        for(let item of res) {
            item['state'] = getActivityState(item)
            delete item.userInfo[0].password
        }
        ctx.response.body = {
            code: 2000,
            result: res
        }
    })
}

/**
 * 删除活动
 */

const deleteActivity = async(ctx, next) => {
    let params = {
        _id: ObjectId(ctx.request.body.id)
    }
    await db.remove(params).then(res=> {
        ctx.response.body = {
            code: 2000,
            result: res,
            msg:'删除活动成功'
        }
    }).catch(err=> {
        ctx.response.body = {
            code: 2000,
            result: err,
            msg:'删除活动成功'
        }
    })
}


/**
 * 获取详情
 * @param ctx
 */

const queryDetail = async (ctx, next) => {
    let params = {
        _id: ObjectId(ctx.query.id)
    }
    await db.aggregate([
        {'$match': params},
        {'$lookup': {
                from: 'userData',
                localField: 'creator',
                foreignField: 'username',
                as: 'userInfo'
            }
        },]).then(res=> {
        // 数据处理
        const data = {}
        res['state'] = getActivityState(res)
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
    // await db.findOne(params).then(res => {
    //     // 数据处理
    //     const data = {}
    //     res['state'] = getActivityState(res)
    //     data['esInformation'] = res
    //     data['mapPoint'] = res.mapPoint
    //     ctx.response.body = {
    //         code: 2000,
    //         result: data,
    //         msg:'查询活动成功'
    //     }
    // }).catch(err=>{
    //     ctx.response.body = {
    //         code: 4000,
    //         msg:'查询失败,err:' + err
    //     }
    // })
}

/**
 * 活动添加
 * @param ctx
 */

const addActivity = async (ctx, next) => {
    let insertData = ctx.request.body
    insertData['userId'] = ctx.header.token
    insertData['signUpUser'] = []
    await db.insert(ctx.request.body).then(res => {
        ctx.response.body = {
            code: 2000,
            result: res,
            msg:'添加活动成功'
        }
    }).catch(err=>{
        ctx.response.body = {
            code: 4000,
            msg:'添加失败',
            err
        }
    })
}

/**
 * 活动封面上传
 * @param ctx
 */

const uploadIMG = async (ctx, next) => {
    const file = ctx.request.files.file
    // 创建可读流
    const reader = fs.createReadStream(file.path);
    const type = ctx.request.req.headers.filename
    // 更改存放文件名
    const fileName = new Buffer(file.name + new Date().getTime()).toString('base64')
    let filePath = path.join(__dirname, `../public/upload/${type}/`) + fileName + `cover.jpg`;
    const upStream = fs.createWriteStream(filePath);
    reader.pipe(upStream);
    // 图片存放地址
    let imgPath = ctx.request.origin + `/upload/${type}/` + fileName + `cover.jpg`
    ctx.response.body = {
        code: 2000,
        path: imgPath,
        msg:'添加图片成功'
    }
}

function handleUserActivities(userParams,type,activity,acParams) {
    if(type === 'full') return false
    dbUser.find(userParams).then(res=> {
        let userData = res[0]
        if(!userData['activities']) userData['activities'] = []

        let fn = {
            add: ()=> {
                userData['activities'].push(activity)
            },
            remove: ()=> {
                userData['activities'].splice(userData['activities'].findIndex(n=> n._id === activity._id),1)
            },
        }

        fn[type]()
        dbUser.update(userParams,userData) //用户列表更新活动

    })
}

const signUpActivity = async (ctx, next) => {
    if(!ctx.header.token) {
        ctx.response.body = {
            code: 4001,
            msg: '请先登陆'
        }
        return false
    }
    let userId = getObjId(ctx.header.token,'string')
    let signUpData = ctx.request.body
    let activityId = ObjectId(signUpData.activityId)
    let params = {
        _id: activityId
    }
    let userParams = {
        _id: ObjectId(userId)
    }


    await db.find(params).then(res=> {
        let update = res[0]
        let type = ''
        let index = update.signUpUser.findIndex((n)=> n.userId === userId)
        const fn = {
            signUp: ()=> {
                if(update.signUpUser.length == update.people) {
                    type = 'full'
                } else {
                    update.signUpUser.push({
                        userName: signUpData.userName,
                        userId
                    })
                    type = 'add'
                }

            },
            cancel: ()=> {
                update.signUpUser.splice(index, 1);
                type = 'remove'
            }
        }
        index > -1 ? fn.cancel() : fn.signUp()

        handleUserActivities(userParams,type,update,params)
        let bodyMsg = {
            remove: '已取消报名',
            add: '报名成功',
            full: '报名已满'
        }
        if(update.signUpUser.length === update.people) {
            update['isFull'] = 'full'
        } else {
            update['isFull'] = 'noFull'
        }
        db.update(params,update)
        ctx.response.body = {
            code: 2000,
            msg: bodyMsg[type]
        }
    }).catch(err=> {
        ctx.response.body = {
            code: 4000,
            msg: '报名失败，请联系管理员',
            err,
        }
    })
}

/**
 * 获取自己发布活动
 */
const getMyActivities = async (ctx,next) => {
    let query = {
        userId:getObjId(ctx.header.token,'string')
    }
    console.log(query)
    await db.find(query).then(res=> {
        if(res.length) {
            for(let item of res) {
                item['state'] = getActivityState(item)
            }
        }
        ctx.response.body = {
            code: 2000,
            data: res,
            msg: '成功'
        }
    }).catch(err=> {

    })
}

module.exports = {
    'GET /activity/query': getActivity,
    'POST /activity/add': addActivity,
    'GET /activity/detail': queryDetail,
    'POST /activity/uploadIMG': uploadIMG,
    'POST /activity/signUp': signUpActivity,
    'GET /activity/myActivities': getMyActivities,
    'POST /activity/delete': deleteActivity,
}
