express = require('express');
app = express();

app.use(express.static('public'));
app.get("/", function(req, res){
    res.render("homepage.ejs");
});

app.get("/grid", function(req, res){
    res.render("gridpage.ejs");
});

app.listen(app.env.PORT, function(){
    console.log("server ahas started succesfully!");
})