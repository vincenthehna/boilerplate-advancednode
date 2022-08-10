const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {
    const ensureAuthenticated = function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect("/");
    };

    app.route("/").get((req, res) => {
        // Change the response to render the Pug template
        res.render("pug", {
            title: "Connected to Database",
            message: "Please login",
            showLogin: true,
            showRegistration: true,
        });
    });

    app.route("/profile").get(ensureAuthenticated, function (req, res) {
        res.render(process.cwd() + '/views/pug/profile', { username: req.user.username });
    });


    app.route("/logout").get((req, res) => {
        req.logout();
        res.redirect("/");
    });

    app.route("/register").post(function (req, res, next) {
        myDataBase.findOne({ username: req.body.username }, function (err, user) {
            if (user) {
                res.redirect("/");
            } else if (err) {
                next(err);
            } else {
                const hash = bcrypt.hashSync(req.body.password, 12);
                myDataBase.insertOne(
                    {
                        username: req.body.username,
                        password: hash,
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
        passport.authenticate('local', { failureRedirect: '/' }),
        function (req, res, next) {
            res.redirect('/profile')
        });



}