require("dotenv").config()
const express=require("express");
const bodyparser=require("body-parser");
const mongoose=require("mongoose");
const ejs=require("ejs");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const app=express();

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended:true}));

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true
}))

app.use(passport.initialize());
app.use(passport.session());
const db_URI=process.env.MONGO_URL
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
mongoose.connect(db_URI,dbOptions)
.then(()=>{
    console.log("connected")
})
.catch((err)=>{
    console.log(err)
})
const userSchema=new mongoose.Schema({
     username:String,
     password:String,
})

userSchema.plugin(passportLocalMongoose)
const bookSchema=new mongoose.Schema({
    name:String,
    requests:Number
})

const User=mongoose.model("User",userSchema);

passport.use(User.createStrategy())
passport.use(User.createStrategy());
passport.serializeUser((user,done)=>{
    done(null,user.id)
});
passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then((user)=>{
        done(null,user)
    })
});

const Book=mongoose.model("Book",bookSchema)

app.route("/")
.get((req,res)=>{
    res.render("landing")
})

app.route("/admin-registration")
.get((req,res)=>{
    res.render("adminRegi")
})
.post((req,res)=>{
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err)
            res.redirect("/admin-registration")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/admin")
            })
        }
    })
})

app.route("/user-registration")
.get((req,res)=>{
    res.render("userRegi")
})
.post((req,res)=>{
   User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
        console.log(err)
        res.redirect("/user-registration")
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/user")
        })
    }
   })
})

app.route("/admin-login")
.get((req,res)=>{
    res.render("adminlogin")
})
.post((req,res)=>{
    const user=new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/admin")
            })
        }
    })
})

app.route("/user-login")
.get((req,res)=>{
    res.render("userLogin")
})
.post((req,res)=>{
    const user=new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/user")
            })
    }
 })
})

app.route("/admin")
.get((req,res)=>{
    if(req.isAuthenticated()){
        Book.find()
        .then((founditems)=>{
            res.render("admin.ejs",{books:founditems})
        })
        .catch((err)=>{
            console.log(err)
        })
    }else{
        res.redirect("/admin-login")
    }
})
.post((req,res)=>{
    const formID=req.body.formID;
    if (formID==="form1") {
        const newBook=new Book({
            name:req.body.bookName,
            requests:0
        })
        newBook.save()
        .then(()=>{
            Book.find()
            .then((founditems)=>{
                res.render("admin.ejs",{books:founditems})
            })
            .catch((err)=>{
                console.log(err)
            })
        })
        .catch((err)=>{
            console.log(err)
        })
      } else if (formID==="form2") {
        Book.deleteOne({name:req.body.removeBook})
        .then(()=>{
            Book.find()
            .then((founditems)=>{
                res.render("admin.ejs",{books:founditems})
            })
            .catch((err)=>{
                console.log(err)
            })
        })
      } else{
        Book.findOneAndUpdate({name:req.body.oldBook},{name:req.body.newBook},{new:true})
        .then(()=>{
            Book.find()
            .then((founditems)=>{
                res.render("admin.ejs",{books:founditems})
            })
            .catch((err)=>{
                console.log(err)
            })
        })
        .catch((err)=>{
            console.log(err)
        })
      }
})


app.route("/user")
.get((req,res)=>{
    if (req.isAuthenticated()){
        res.render("user",{student:req.user.username})
    }else{
        res.redirect("/user-login")
    }
})
.post((req,res)=>{
    const formID=req.body.formID;
    if (formID==="form1"){
        Book.findOne({name:req.body.bookName})
        .then((founditem)=>{
            res.render("user",{book:founditem})
        })
        .catch((err)=>{
            console.log(err)
        })
    }else{
        Book.findOne({name:req.body.bookReq})
        .then((founditem)=>{
            const requestno=founditem.requests+1;
            Book.updateOne({name:req.body.bookReq},{requests:requestno},{new:true})
            .then(()=>{
                res.render("user")
            })
            .catch((err)=>{
                console.log(err)
            })
        })
        .catch((err)=>{
            console.log(err)
        })
       
    }
})

app.listen(process.env.PORT || 3000,(()=>{
    console.log("server started on port 3000")
}))

 

