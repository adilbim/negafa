express = require('express');
app = express();
port = process.env.PORT;

app.use(express.static('public'));
app.get("/", function(req, res){
    res.render("homepage.ejs");
});

app.get("/grid", function(req, res){
    res.render("gridpage.ejs");
});

// app.listen(5000, function(){
//     console.log("server ahas started succesfully!");
// });

if (port == null || port == "") {
    port = 8000;
  }
  app.listen(port);