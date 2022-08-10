"use strict";
require("dotenv").config({ path: "./sample.env" });

const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const routes = require('./routes.js');
const auth = require("./auth.js");

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

	routes(app,myDataBase);
	auth(app,myDataBase);
	
	app.use((req, res, next) => {
		res.status(404).type("text").send("Not Found!1111");
	});

}).catch((e) => {
	app.route("/").get((req, res) => {
		res.render("pug", { title: e, message: "Unable to login" });
	});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Listening on port now" + PORT);
});
