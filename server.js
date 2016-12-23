
var express = require("express");
var fs = require('fs');
var read = fs.readFileSync;
var ejs = require("ejs");
var validUrl = require('valid-url');
var app = express();
var rt={};
var errobj={};

require('dotenv').load();
var conString = process.env.DATABASE_URL;
var pg_exec = require("./dbconfig.js").pg_exec(conString);

app.get("/",function(req,res){ // 对 / 的处理
    var serverHost=req.protocol+"://"+req.host+"/"
    var noRestStr= ejs.render(read("root.ejs","utf-8"),{serverHost:serverHost});
        res.end(noRestStr)
});

app.get(/^\/\d+$/,function(req,res){ // 对 /<数字> 的处理
    var allPath = decodeURI(req.path) //解码出查询数据
    var sid = allPath.replace(/^\//,""); // 获取到实际查询数据
    var sidNum = parseInt(sid);
    console.log("setep1:"+sidNum);
    pg_exec({
            name:"select",
            text:"SELECT sid,url FROM xdssurl WHERE sid=$1::int",
            values:[sidNum]},
        function(err,result){
            if(err){
                console.log("ERR2-:"+err);
                return;
            }
            if(result.rowCount>0){
                let url=result.rows[0]["url"];
                console.log("需要重定向到"+url);
                res.redirect(url);
                return;
            }else{
                errobj["error"]="传入的短地址没有定义"
                console.log("输出错误信息2");
                res.end(JSON.stringify(errobj),"utf-8");
                return;
            }
        }
    );
});

app.get("/new/*",function(req,res){
    var allPath = decodeURI(req.path) //解码出查询数据
    var serverHost=req.protocol+"://"+req.host+"/"
    if (allPath==="/new/"){
        var noRestStr= ejs.render(read("root.ejs","utf-8"),{serverHost:serverHost});
        res.end(noRestStr)
    }else{  
        let url = allPath.replace(/^\/new\//,""); // 获取到实际查询数据
        if (validUrl.isUri(url)){ // url 是有效的url
            console.log("setep2");
            let qtext="SELECT sid,url FROM xdssurl WHERE url='"+url+"'";
            pg_exec({ //尝试插入
                    name:"insert",
                    text:"INSERT INTO xdssurl (url) VALUES($1::text)",
                    values:[url]
                }
                ,function(err){
                    if(err){
                        if(err.code==23505){ // 数据已经插入过的错误，仅仅记录不处理
                            console.log(url+"已经记录过");
                        }else{ // 其他数据库错误，输出情况并停止后续处理
                            console.log(url+"其他数据库错误");
                            errobj["error"]="数据库错误0"
                            console.log("数据库错误0");
                            res.end(JSON.stringify(errobj),"utf-8");
                            return;
                        }
                    }
                    console.log("setep3+"+url);
                    console.log(qtext);
                    let tmpQObj={name:"select",
                        text:qtext,
                        value:[]
                        }
                    pg_exec(tmpQObj
                        ,function(err2,result1){
                            if(err2){
                                console.log("err3:"+JSON.stringify(err2));
                                errobj["error"]="数据库错误1"
                                console.log("数据库错误1");
                                res.end(JSON.stringify(errobj),"utf-8");
                                return;
                            }
                            //console.log(JSON.stringify(result1));
                            if(result1.rowCount>0){
                                let rt={};
                                console.log(JSON.stringify(result1));
                                rt["original_url"]=result1.rows[0]["url"];
                                rt["short_url"]=serverHost+result1.rows[0]["sid"];
                                console.log(JSON.stringify(result1.rows));
                                res.end(JSON.stringify(rt),"utf-8")
                                return;
                            }else{
                                errobj["error"]="数据库错误1"
                                console.log("数据库错误1");
                                res.end(JSON.stringify(errobj),"utf-8");
                                return;
                            }
                        }
                    );
                    tmpQObj={}
                }
            );
            
        }else{ // 不是有效的url
            errobj["error"]="传入的短地址不是有效的URL"
            console.log("输出错误信息0");
            res.end(JSON.stringify(errobj),"utf-8");
        }
    }
    return;
});

app.get("/*",function(req,res){
    errobj["error"]="传入的短地址不是有效数字"
    console.log("输出错误信息3");
    res.end(JSON.stringify(errobj),"utf-8");
    return;
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});