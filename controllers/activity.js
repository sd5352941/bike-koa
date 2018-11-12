/**
 * 活动管理
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */

//活动查询

var getActivity = async (ctx, next) => {
    ctx.response.body = {
        code: 2000,
        result: [{
            esInformation:{
                name:'abc',
                region:'ccc'
            }
        }]
    }
}


module.exports = {
    'GET /activity/query': getActivity
}