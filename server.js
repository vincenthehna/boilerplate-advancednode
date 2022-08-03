"use strict";
require("dotenv").config({ path: "./sample.env" });

const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const app = express();

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
		cookie: { secure: false },
	})
);

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "pug");

myDB(async (client) => {
	const myDataBase = await client.db("database").collection("users");

	// Be sure to change the title
	app.route("/").get((req, res) => {
		// Change the response to render the Pug template
		res.render("pug", {
			title: "Connected to Database",
			message: "Please login",
			showLogin: true,
			showRegistration: true,
		});
	});

	app.post("/register", function (req, res,next) {
		myDataBase.findOne({ username: req.body.username }, function (err, user) {
			if (user) {
				res.redirect("/");
			} else if (err) {
				next(err);
			} else {
				myDataBase.insertOne(
					{
						username: req.body.username,
						password: req.body.password,
					},
					function (err, doc) {
						if (err) res.redirect("/");
						console.log(doc.ops);
						next(null, doc.ops[0]);
					}
				);
			}
		});
	},
  passport.authenticate('local', {failureRedirect:'/'}), 
  function(req,res,next){
    res.redirect('/profile')
  });

	passport.use(
		new LocalStrategy(function (username, password, done) {
			myDataBase.findOne({ username: username }, (err, user) => {
				console.log("User " + username + " attempted to log in.");
				if (err) done(err);
				if (!user) return done(null, false);
				if (password !== user.password) return done(null, false);
				return done(null, user);
			});
		})
	);

	app.post(
		"/login",
		passport.authenticate("local", { failureRedirect: "/" }),
		function (req, res) {
			console.log(req.user);
			res.redirect("/profile");
		}
	);

	// Serialization and deserialization here...

	passport.serializeUser((user, done) => {
		done(null, user._id);
	});

	passport.deserializeUser((id, done) => {
		myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
			done(null, doc);
		});
	});

	app.use((req, res, next) => {
		res.status(404).type("text").send("Not Found");
	});

	app.route("/profile").get(ensureAuthenticated, function (req, res) {
		res.render(process.cwd() + "/views/pug/profile", { username: req.user.username });
	});

	app.route("/logout").get((req, res) => {
		req.logout();
		res.redirect("/");
	});

	// Be sure to add this...
}).catch((e) => {
	app.route("/").get((req, res) => {
		res.render("pug", { title: e, message: "Unable to login" });
	});
});

const ensureAuthenticated = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/");
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Listening on port " + PORT);
});
