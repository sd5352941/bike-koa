const Monk = require('monk')
// const db = new Monk('yyh:s5647513@175.178.40.9/admin')
const db = new Monk('127.0.0.1:27017/admin')

module.exports= {
    db
}