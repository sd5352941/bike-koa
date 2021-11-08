// const db = new Monk('localhost:27017/runoob').get('activityList');
const db = require('../mongo').db.get('activityList')//链接到活动数据库
const dbUser = require('../mongo').db.get('userData') //链接到用户数据库
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs')
const path = require('path')

/**
 * 获取活动列表
 * @param ctx
 */

const getActivity = async (ctx, next) => {
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
}

/**
 * 获取详情
 * @param ctx
 */

const queryDetail = async (ctx, next) => {
    let params = {
        _id: ObjectId(ctx.query.id)
    }
    await db.find(params).then(res => {
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

const addActivity = async (ctx, next) => {
    let insertData = ctx.request.body
    insertData['userId'] = new Buffer.from(ctx.header.token,'base64').toString()
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
    dbUser.find(userParams).then(res=> {
        let userData = res[0]
        if(!userData['activities']) userData['activities'] = []

        let fn = {
            add: ()=> {
                userData['activities'].push(activity)
            },
            remove: ()=> {
                userData['activities'].splice(userData['activities'].findIndex(n=> n._id === activity._id),1)
            }
        }

        fn[type]()
        dbUser.update(userParams,userData) //用户列表更新活动

    })
}

const signUpActivity = async (ctx, next) => {
    let userId = new Buffer.from(ctx.header.token,'base64').toString()
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
                update.signUpUser.push({
                    userName: signUpData.userName,
                    userId
                })
                type = 'add'

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
            add: '报名成功'
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

module.exports = {
    'GET /activity/query': getActivity,
    'POST /activity/add': addActivity,
    'GET /activity/detail': queryDetail,
    'POST /activity/uploadIMG': uploadIMG,
    'POST /activity/signUp': signUpActivity,


}
