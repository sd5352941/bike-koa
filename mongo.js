const Monk = require('monk')
const db = new Monk('localhost:27017/runoob')

module.exports= {
    db
}