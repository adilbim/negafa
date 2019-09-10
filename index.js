var express = require('express');
var app = express();
var port = process.env.PORT;
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var localstrategy = require('passport-local');
var passportlocalmongoose = require('passport-local-mongoose');
var methodoverride = require('method-override');
//const mapboxgl = require('mapbox-gl');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(methodoverride('_method'));
/////////////////////////////////////////////////


//connect to the database
mongoose.connect('mongodb+srv://adilbim:hackeddetected@cluster0-1m98q.gcp.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true});
//////////////////////////////////////////////////////////////
var userSchema = new mongoose.Schema({
   username: String,  password: String,
   email: String,     adress: String,
   phonenumber: String, description: String,
   city: String,
   posts: [{ 
    type: mongoose.Schema.Types.ObjectId ,
    ref: 'post'
  }],
  comment: [{ 
    type: mongoose.Schema.Types.ObjectId ,
    ref: 'comment'
  }]
});
userSchema.plugin(passportlocalmongoose);
var user = mongoose.model("user", userSchema);
//////////////////////////////////////////////////////////////
var citiesSchema = new mongoose.Schema({
    asciiname: String,
    population: Number,
    location: String
});

var citie = mongoose.model("citie", citiesSchema);
/////////////////////////////////////////////////////////////
//make a comments schema
var commentschema = new mongoose.Schema({
    author: String,
    content: String
});
//make comment model
var comment = mongoose.model('comment', commentschema);
///////////////////////////////////////////////////////////////
//make a post schema
var postschema = new mongoose.Schema({
    description: String,
    image: String,
    author:{
        _id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        city: String,
        username: String,
        description: String,
        adress: String

    },
    comments: [{ 
        type: mongoose.Schema.Types.ObjectId ,
        ref: 'comment'
      }],
      date : { type: Date, default: Date.now }
});
//make a post model
var post = mongoose.model('post', postschema);
/////////////////////////////////////////////////// passport configuration
app.use(require('express-session')({
    secret: "this is my first real project",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});
////////////////////////////////////////////////////// roots!

app.get("/", function(req, res){
    res.render("homepage.ejs");
    //console.log(req.user);
});


app.get("/posts", function(req, res){
    //get the data from the database!
    post.find({}, function(err,posts){
        if(err)
        {
            console.log("error from getting data!");
        }
        else
        {
            res.render("gridpage.ejs",{data: posts});
            //console.log(posts);
        }
    });
   // 
});

app.get("/profile/:id", function(req, res){
    user.findById(req.params.id).populate("posts").exec(function(err, user){
        if(err)
        {
            console.log(err);
        }
        else{
            res.render("newimage.ejs", {user: user});
            console.log(user);
        }
    })
});

app.get("/posts/:id" , function(req, res){
    post.findById(req.params.id).populate("comments").exec(function(err, backfromdb){
        if(err)
        {
            console.log("error " + err); 
        }
        else
        {
            res.render("show.ejs", {backdata : backfromdb});
            // console.log(backfromdb.author._id);
            // console.log(req.user._id);
           
        }
    });
});

app.post("/posts/:id", function(req, res){
    var imglink = req.body.imglink;
    var description = req.body.description;

    user.findById(req.params.id, function(err, foundUser){
        if(err)
        {
            console.log(err);
        }
        else{
            post.create({description: description , image: imglink },
                function(err,newpost){
                    if(err)
                    {
                        console.log("there is an erreur !");
                    }
                    else{
                        newpost.author._id = req.user._id;
                        newpost.author.city = req.user.city;
                        newpost.author.username = req.user.username;
                        newpost.author.description = req.user.description;
                        newpost.author.adress = req.user.adress;
                        newpost.save();
                        foundUser.posts.push(newpost);
                        foundUser.save();
                        res.redirect("/posts");
                    }
                });
        }
    });

   
});
////////////////////////////////////////////////////////////////////
///EDIT POSTS
////////////////////////////////////////////////////////////////////
app.get("/posts/:id/edit", function(req, res){
    post.findById(req.params.id, function(err, foundPost){
        if(err)
        {
            console.log(err);
        }
        else{
            res.render("edit.ejs", {post: foundPost});
        }
    })
})
app.put("/posts/:id", function(req, res){
    post.findByIdAndUpdate(req.params.id, req.body.post, function(err, foundPost){
       if(err){
           console.log(err);
       }
       else{
         res.redirect("/posts/" + req.params.id);
       }
    });
});
//////////////////////////////////////////////////////////////////////
////////////////////DESTROY POST////////////////////////////////////
/////////////////////////////////////////////////////////////////////
app.delete("/posts/:id",function(req, res){
    post.findByIdAndDelete(req.params.id, function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.redirect("/posts");
        }
    })
});
//////////////////////////////////////////////////////////////////////
//COMMENTS
/////////////////////////////////////////////////////////////////////
app.post("/comments/:id", function(req, res){
    post.findById(req.params.id, function(err, foundPost){
        
        if(err)
        {
            console.log(err);
        }
        comment.create(req.body.comment, function(err, comment){
            if(err)
            {
                console.log(err);
            }
            else{
                foundPost.comments.push(comment);
                foundPost.save();
                console.log("created comment");
                res.redirect("/posts/" + foundPost._id + "#comments");
            }
        });
    });    
});
///////////////////////////////////////////////////////////////////////
////Destroy Comments
///////////////////////////////////////////////////////////////////////
app.delete("/posts/:id/comment/:comment_id", function(req, res){
    comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.redirect("/posts/" + req.params.id + "#comments");
        }
    });
});
/////////////////////////////////////////////////////////////////////
//Authentication
/////////////////////////////////////////////////////////////////////
app.get("/register", function(res, res){
    citie.find({}, function(err,cities){
        if(err)
        {
           console.log(err);
        }
        else{
            res.render("register.ejs", {cities : cities});
            //console.log(cities);
        }
    });
});
app.get("/login", function(req, res){
    res.render("login.ejs");  
});
//register
app.post("/register", function(req, res){
   var newuser = new user({
    username: req.body.username, 
    email: req.body.email,
    adress: req.body.adress,
    city: req.body.city,
    description: req.body.description,
    phonenumber: req.body.phonenumber, 
   });
   user.register(newuser, req.body.password, function(err, user){
       if(err)
       {
           console.log(err);
           return res.render("login.ejs");
       }
       else{
           passport.authenticate("local")(req, res, function(){
               res.redirect("/posts");
           });
       }
   });
});
//login
app.post("/login",passport.authenticate("local",
     {
        successRedirect: "/posts",
        failureRedirect: "/login"
     }
));
//logout
app.get("/logout", function(req, res){
    req.logOut();
    res.redirect("/posts");
})


// mdina.forEach(function(mdina){
//     citie.create(mdina, function(err, mdina){
//         if(err)
//         {
//             console.log(err);
//         }
//         else
//         {
//            console.log(mdina.asciiname);
//         }
//     });
// });

/////////////////////////////////////////////////////////////////////
// app.listen(5000, function(){
//     console.log("server ahas started succesfully!");
// });

if (port == null || port == "") {
    port = 8000;
  }
  app.listen(port);