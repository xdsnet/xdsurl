var pg = require('pg');
pg.defaults.ssl = true; // 对于heroku时必须要，注意取消注释
exports.pg_exec = function(conString){
    var tfun=function(prepared_obj,cb){
        pg.connect(conString, function(err, client, done) {
            if(err) {
                done();
                console.log("数据库链接错误!");
                cb(err,{"rowCount":0})
                return;
            }
            client.query(prepared_obj, function(err, result) {
                done();
                let e=err,r=result;
                cb(err,result);
                return;
            });
        });
    }
    return tfun;
}