var express = require('express');
var app = express();
var bodyparser = require('body-parser');
var flash=require('connect-flash');
var session=require('express-session');

//数据库操作相关
var mongo=require('mongodb');
var Server=mongo.Server;
var DB=mongo.Db;
var server=new Server('localhost',27017,{auto_reconnect: true});
var db=new DB('myblog',server);

var MongoClient=require('mongodb').MongoClient;
var DB_CONN_STR='mongodb://localhost:27017/myblog';

//mongoDB数据库相关
var mongoStore=require('connect-mongo')(session);

// 创建 application/x-www-form-urlencoded 编码解析
var urlencodedparser = bodyparser.urlencoded({ extended: false });
app.use(bodyparser.json());

app.use(express.static('public'));
app.use(session({
    secret: '1234',  //加密
    key: 'myblog', //cookie nam
    cookie: {maxAge: 1000*60*60*24},
    saveUninitialized: true,
    //使用mongoDB存储session信息
    store:new mongoStore({
        url:'mongodb://localhost/myblog',
        port:27017,
        db:'myblog'
    })
}));
app.use(flash());

app.use(function (req,res,next) {
    res.locals.session=req.session;
    //增加用户登录错误提示
    var err=req.session.error;
    delete req.session.error;
    res.locals.message='';
    if(err){
        res.locals.message='<div class="alert alert-error">'+err+'</div>';
    }
    next();
})

app.get('/index.html', function (req, res) {
    res.sendfile( __dirname + "/" + "index.html" );
})


/* get home page. */
app.get('/', function(req, res, next) {
  res.render('index', { title: 'MyBlog' });
});

app.get('/hello',function(req,res,next){
  res.send('the time is'+new date().todatestring());
});

//访问用户的个人页面
app.get('/user/:username',function(req,res){
  res.send('user:'+req.params.username);
});

app.get('/list',function (req,res) {
    res.render('list',{
        title:"list",
        layout:"admin",
        items:['1992','lizq','express','nodejs']
    });
});

//个人微博系统路由

//定义检查用户的方法
function checkUsers(req,res,next) {
    console.log('检查用户');
    if(!req.session.user){
        req.session.error='请先登录';
        return res.redirect('/login');
    }
    next();
}

function notCheckUsers(req,res,next) {
    if(req.session.user){
        req.session.error='已登录';
        return res.redirect('/');
    }
    next();
}
//首页
app.get('/',function (req,res) {
    res.render('index',{title:'express'});
});

//用户主页
app.get('/user/:username',function(req,res){

});

//发表信息
app.post('/post',function (req,res) {

});

//用户注册
app.get('/reg',function (req,res) {
    res.render('reg',{title:'lizq'});

});

app.post('/reg',urlencodedparser,function (req,res) {
    console.log('用户请求到达')
    var user={
        '_id':'1',
        username:req.body.username,
        password:req.body.password
    };
    insertUser(user);
    res.send(JSON.stringify(user));

});
function insertUser(data) {
    db.open(function (err,db) {
        if(!err){
            console.log('连接成功！');
            db.collection('users',function (err,collection) {
                collection.insert(data,{safe:true},function (err,result) {
                    if(!err){
                        console.log('数据插入成功。');
                    }else{
                        console.log('数据插入失败。');
                    }
                });
            })
        }
        db.close();
    })

}


//判断用户是否登录
app.all('/login',notCheckUsers);

//用户登录
app.get('/login',function (req,res) {
    res.render('login',{title:'登录'});
});

app.post('/login',function (req, res){
    console.log('用户请求到达')
    var user={
        username:'admin',
        password:'admin'
    }
    if(req.body.username==user.username&&req.body.password==user.password){
        req.session.user=user;
        res.redirect('/home');
    }else{
        req.session.error='用户名或密码不正确';
        return res.redirect('/login');
    }

});



//检查用户是否登录，登录之后才能访问主页
app.get('/home',checkUsers);

//用户登录成功后跳转到主页
app.get('/home',function (req,res) {
   res.render('home',{title:'Home'});
});

//用户登出页面判断用户是否登录
app.get('/logout',checkUsers);

//用户登出
app.get('/logout',function (req,res) {
    delete req.session.user;
    res.render('index',{title:'myblog'});
});


//测试页面
app.get('/test',function (req,res) {
    res.render('test',{title:'Home'});
});

app.get('/aaa', function(req, res){

    if(req.session.lastPage) {
        console.log('Last page was: ' + req.session.lastPage + ".");
    }
    req.session.lastPage = '1234'; //每一次访问时，session对象的lastPage会自动的保存或更新内存中的session中去。
    req.session.user='name=lizq';
    res.send('响应。');
    //res.send("You're Awesome. And the session expired time is: " + req.session.cookie.maxAge);
});


app.get('/rrr', function(req, res){
    if (req.session.lastPage) {
        console.log('Last page was: ' + req.session.lastPage + ".");
    }
    req.session.lastPage = '/radical';
    res.send('What a radical visit! And the session expired time is: ' + req.session.cookie.maxAge);
});

//爬虫相关
var myUtil=require('./myUtil');
var jsdom=require('jsdom');
var window = jsdom.jsdom().defaultView;
var $ = require('jquery')(window);
//var cheerio=require('cheerio');
app.get('/movie',function (req,res) {
    var url="https://movie.douban.com/subject/25765735/"    //金刚狼3
    myUtil.get(url,function (content,status) {
        console.log("status:="+status);
        //提取电影名和导演 tttt
        var movie={
            name:$(content).find('span[property="v:itemreviewed"]').text(),
            director:$(content).find('#info span:nth-child(1) a').text()
        }
        console.log(movie);
        res.send(content);
    })
});
module.exports = app;
