
var express = require("express");
var fs = require('fs');
var pg=require('pg');
var read = fs.readFileSync;
var ejs = require("ejs");
var validUrl = require('valid-url');
var app = express();
var rt={};
var errobj={};

require('dotenv').load();
pg.defaults.ssl = true; // 对于heroku时必须要，注意取消注释
var conString = process.env.DATABASE_URL; // 定义数据库连接

app.get("/",function(req,res){ // 对 / 的处理
    let serverHost=req.protocol+"://"+req.host+"/"
    let noRestStr= ejs.render(read("root.ejs","utf-8"),{serverHost:serverHost});
        res.end(noRestStr)
});

app.get(/^\/\d+$/,function(req,res){ // 对 /<数字> 的处理
    let allPath = decodeURI(req.path) //解码出查询数据
    let sidStr = allPath.replace(/^\//,""); // 获取到实际查询数据
    let sidNum = parseInt(sidStr);
    console.log("setep1:"+sidNum);
    let Qstr="SELECT sid,url FROM xdssurl WHERE sid="+sidNum+";";
    let pgclient=new pg.Client(conString);
    pgclient.connect(function(err){
        if(err){
            console.log("数据库连接出错1:"+JSON.stringify(err));
            res.end("数据库连接出错1");
        }
        pgclient.query(Qstr,function(e,dbrt){
            pgclient.end();// 无论是否有错误，先中断数据库连接
            if(e){
                console.log("数据库查询出错1:"+JSON.stringify(e));
                errobj["error"]="数据库查询出错1"
                res.end(JSON.stringify(errobj),"utf-8");
                return;
            }
            if(dbrt.rowCount>0){
                let url=dbrt.rows[0]["url"];
                console.log("需要重定向到"+url);
                res.redirect(url);
                return;
            }else{
                errobj["error"]="传入的短地址没有定义"
                console.log("传入的短地址没有定义");
                res.end(JSON.stringify(errobj),"utf-8");
                return;
            }
        });
    });
});

app.get("/new/*",function(req,res){
    let allPath = decodeURI(req.path) //解码出查询数据
    let serverHost=req.protocol+"://"+req.host+"/"
    if (allPath==="/new/"){
        let noRestStr= ejs.render(read("root.ejs","utf-8"),{serverHost:serverHost});
        res.end(noRestStr)
    }else{  
        let urlStr = allPath.replace(/^\/new\//,""); // 获取到实际查询数据
        if (validUrl.isUri(urlStr)){ // url 是有效的url
            console.log("setep2");
            let Istr="INSERT INTO xdssurl (url) VALUES('"+urlStr+"')";
            let Qstr="SELECT sid,url FROM xdssurl WHERE url='"+urlStr+"'";
            let pgclient=new pg.Client(conString);
            pgclient.connect(function(err){
                if(err){
                    console.log("数据库连接出错2:"+JSON.stringify(err));
                    errobj["error"]="数据库连接出错2"
                    res.end(JSON.stringify(errobj),"utf-8");
                    return;
                }
                pgclient.query(Istr,function(e){
                    if(e){
                        if(e.code==23505){
                            console.log("已存在URL:"+urlStr);
                        }else{
                            console.log("插入数据是有错误:"+JSON.stringify(e));
                        }
                        return;
                    }
                });
                pgclient.query(Qstr,function(e,dbrt){
                    pgclient.end();// 无论是否有错误，先中断数据库连接
                    if(e){
                        console.log("数据库查询出错2:"+JSON.stringify(e));
                        errobj["error"]="数据库查询出错2"
                        res.end(JSON.stringify(errobj),"utf-8");
                        return;
                    }
                    if(dbrt.rowCount>0){
                        //console.log(JSON.stringify(dbrt));
                        rt["original_url"]=dbrt.rows[0]["url"];
                        rt["short_url"]=serverHost+dbrt.rows[0]["sid"];
                        console.log(JSON.stringify(dbrt.rows));
                        res.end(JSON.stringify(rt),"utf-8")
                        return;
                    }else{
                        errobj["error"]="数据库错误3"
                        console.log("数据库错误3");
                        res.end(JSON.stringify(errobj),"utf-8");
                        return;
                    }
                });
            });
        }else{ // 不是有效的url
            errobj["error"]="传入的URL地址不是有效的URL"
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