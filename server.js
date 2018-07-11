const express = require('express');
const app = express();
const hb = require('express-handlebars');
const db = require('./db/db');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const csurf = require('csurf');
const bc = require('./bc/bcrypt');

app.use(cookieParser());

app.use(cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));


app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use(csurf());
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});



app.get('/petition', checkForNoLog, (req, res) => {
    db.getYourSignature(req.session.userId)
        .then(user => {
            if (user == undefined) {
                res.render('petition', {
                    layout: 'main'
                });
            } else {
                res.redirect('/thanks');
            }
            // console.log(user)
        }).catch(err => {
            console.log(err);
        });
});

app.post('/petition', (req, res) => {
    // console.log(req.body);
    db.insertSigner(req.session.userId, req.body.signature)
        .then(() => {
            // console.log(newUser);
            res.redirect('/thanks');
        }).catch(() => {
            res.render('petition', {
                layout: 'main',
                err : "Please sign in the field below"
            });

        });

});

app.get('/thanks', checkForNoLog, checkForNoSig, (req, res) => {
    db.getYourSignature(req.session.userId)
        .then(user => {
            // console.log(user)
            res.render('thanks', {
                layout: 'main',
                user: user
            });
        }).catch(err => {
            console.log(err);
        });

});

app.post('/thanks', (req, res) => {
    // console.log(req.body);
    db.deleteSignature(req.session.userId)
        .then(() => {
            // console.log(newUser);
            res.redirect('/petition');
        }).catch((error) => {
            console.log(error);
        });

});

app.get('/signed', checkForNoLog, checkForNoSig, (req, res) => {
    db.getSigners()
        .then(userList => {
            res.render('signed', {
                layout: 'main',
                userList: userList,
            });
        }).catch(err => {
            console.log(err);
        });
});

app.get('/signed/:city', checkForNoLog, checkForNoSig, (req, res) => {
    db.getSignersByCity(req.params.city)
        .then(userList => {
            res.render('signedCity', {
                layout: 'main',
                userList: userList,
            });
        }).catch(err => {
            console.log(err);
        });
});

app.get('/register', checkForLog, (req, res) => {
    res.render('register', {
        layout: 'main',
    });
});

app.post('/register', (req, res) => {
    bc.hashPassword(req.body.password)
        .then(hashedPassword => {
            console.log("hashedPassword: ", hashedPassword);
            db.insertUser(req.body.firstname, req.body.lastname, req.body.email, hashedPassword)
                .then(newUser => {
                    req.session.userId = newUser.id;
                    console.log(req.session.userId);
                    // console.log(newUser);
                    res.redirect('/profile');
                }).catch(() => {
                    res.render('register', {
                        layout: 'main',
                        err : "You have not filled in all the required fields or your Email is already taken, please try again"
                    });
                });
        })
        .catch(err => {
            console.log(err);
        });
    // console.log(req.body);
});

app.get('/profile', checkForNoLog, (req, res) => {
    res.render('profile', {
        layout: 'main',
    });
});

app.post('/profile', (req, res) => {
    db.insertProfile(req.session.userId, req.body.age, req.body.city, req.body.url)
        .then(newProfile => {
            console.log(newProfile);
            res.redirect('/petition');
        })
        .catch((error) => {
            console.log(error);
            res.render('profile', {
                layout: 'main',
                err : "Something wrong happened"
            });
        });
    // console.log(req.body);
});

app.get('/profile/edit', checkForNoLog, (req, res) => {
    db.getYourUserInfo(req.session.userId)
        .then(userInfo => {
            // console.log(userInfo);
            res.render('editProfile', {
                layout: 'main',
                userInfo: userInfo
            });
        })
        .catch((error) => {
            console.log(error);
        });
});

app.post('/profile/edit', (req, res) => {
    if (req.body.password.length == 0) {
        // console.log(req.body.password);
        db.editUserNoPassword(req.session.userId, req.body.firstName, req.body.lastName, req.body.email)
            .then(updatedUserInfo => {
                console.log(updatedUserInfo);
                // res.redirect('/profile/edit');
            })
            .catch((e) => {
                console.log(e);
                db.getYourUserInfo(req.session.userId)
                    .then(userInfo => {
                        // console.log(userInfo);
                        return res.render('editProfile', {
                            layout: 'main',
                            userInfo: userInfo,
                            err : "You have not filled in all the required fields or your new Email is already taken, please try again"
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            });
    } else {
        bc.hashPassword(req.body.password)
            .then(hashedPassword => {
                db.editUserPassword(req.session.userId, req.body.firstName, req.body.lastName, req.body.email, hashedPassword)
                    .then(updatedUserInfo => {
                        // console.log(updatedUserInfo);
                        // return res.redirect('/profile/edit');
                    })
                    .catch(() => {
                        db.getYourUserInfo(req.session.userId)
                            .then(userInfo => {
                                // console.log(userInfo);
                                return res.render('editProfile', {
                                    layout: 'main',
                                    userInfo: userInfo,
                                    err : "You have not filled in all the required fields or your Email is already taken, please try again"
                                });
                            })
                            .catch((error) => {
                                console.log(error);
                            });
                    });
            })
            .catch(err => {
                console.log(err);
            });

    }
    db.editProfile(req.session.userId, req.body.age, req.body.city, req.body.url)
        .then(updatedProfileInfo => {
            console.log(updatedProfileInfo);
            return res.redirect('/profile/edit');
        })
        .catch((er) => {
            console.log(er);
        });
    // console.log(req.body);
});


app.get('/login', checkForLog, (req, res) => {
    res.render('logIn', {
        layout: 'main',
    });
});

app.post('/login', (req, res) => {
    console.log("posting is working");
    db.getYourUser(req.body.email)
        .then(user => {
            bc.checkPassword(req.body.password, user.hashed_password)
                .then(doThePasswordsMatch => {
                    console.log("doThePasswordsMatch: ", doThePasswordsMatch);
                    if (doThePasswordsMatch) {
                        req.session.userId = user.id;
                        console.log(req.session.userId);
                        res.redirect('/petition');
                    } else {
                        console.log("false password page")
                        res.render('logIn', {
                            layout: 'main',
                            error: "The password is wrong, please try again"
                        });
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        })
        .catch(err => {
            console.log(err);
        });
});

app.get('/logout', checkForNoLog,(req, res) => {
    req.session.userId = null;
    res.render('logOut', {
        layout: 'main',
    });
});

app.post('/logout', (req, res) => {
    console.log("posting is working");
    db.getYourUser(req.body.email)
        .then(user => {
            bc.checkPassword(req.body.password, user.hashed_password)
                .then(doThePasswordsMatch => {
                    console.log("doThePasswordsMatch: ", doThePasswordsMatch);
                    if (doThePasswordsMatch) {
                        req.session.userId = user.id;
                        console.log(req.session.userId);
                        res.redirect('/petition');
                    } else {
                        res.redirect('/login');
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        })
        .catch(err => {
            console.log(err);
        });
});

// app.get('/hash-practice', (req, res) => {
//     bc.hashPassword("trustno1")
//         .then(hashedPassword => {
//             console.log("hashedPassword: ", hashedPassword);
//             bc.checkPassword("trustno1", hashedPassword)
//                 .then(doThePasswordsMatch => {
//                     console.log("doThePasswordsMatch: ", doThePasswordsMatch);
//                 });
//         })
//         .catch(err => {
//             console.log(err);
//         });
//
// });

app.listen(process.env.PORT || 8080, () => {
    console.log('listening  on port 8080');
});


function checkForNoSig( req, res, next) {

    db.getYourSignature(req.session.userId)
        .then(signature => {
            if (signature == undefined) {
                res.redirect('/petition');
            } else {
                next();
            }
            // console.log(user)
        }).catch(err => {
            console.log(err);
        });
}

// function checkForLog ( req, res, next) {
//     req.session.userId
//         ? res.redirect('/petition')
//         : next();
// }

function checkForLog ( req, res, next) {
    req.session.userId
        ? res.redirect('/petition')
        : next();
}

function checkForNoLog ( req, res, next) {
    !req.session.userId
        ? res.redirect('/login')
        : next();
}
