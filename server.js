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



console.log(db);


app.get('/', checkForSig2, (req, res) => {
    res.render('home', {
        layout: 'main'
    });
});

app.post('/', (req, res) => {
    // console.log(req.body);
    db.insertSigner(req.body.firstname, req.body.lastname, req.body.signature)
        .then(newSigner => {
            req.session.signatureId = newSigner.id;
            // console.log(newUser);
            res.redirect('/thanks');
        }).catch(() => {
            res.render('home', {
                layout: 'main',
                err : "Please fill all the fields"
            });

        });

});


app.get('/thanks', checkForSig, (req, res) => {
    db.getYourSignature(req.session.signatureId)
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

app.get('/notsigned', (req, res) => {
    res.render('notSigned', {
        layout: 'main'
    });
});

app.get('/signed', (req, res) => {
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

app.get('/register', (req, res) => {
    res.render('register', {
        layout: 'main',
    });
});
app.post('/register', (req, res) => {
    const hashedUserPassword = bc.hashPassword(req.body.password)
        .then(hashedPassword => {
            console.log("hashedPassword: ", hashedPassword);
            return hashedPassword;
        })
        .catch(err => {
            console.log(err);
        });
    console.log(hashedUserPassword);
    // console.log(req.body);
    db.insertUser(req.body.firstname, req.body.lastname, req.body.email, hashedUserPassword)
        .then(newUser => {
            req.session.userId = newUser.id;
            // console.log(newUser);
            res.redirect('/petitions');
        }).catch(() => {
            res.render('register', {
                layout: 'main',
                err : "Please fill all the fields"
            });
        });
});

app.get('/login', (req, res) => {
    res.render('logIn', {
        layout: 'main',
    });
});
// app.post('/login', (req, res) => {
//     const hashedUserPassword = bc.hashPassword(req.body.password)
//         .then(hashedPassword => {
//             console.log("hashedPassword: ", hashedPassword);
//             return hashedPassword;
//         })
//         .catch(err => {
//             console.log(err);
//         });
//     // console.log(req.body);
//     db.insertUser(req.body.firstname, req.body.lastname, req.body.email, hashedUserPassword)
//         .then(newUser => {
//             req.session.userId = newUser.id;
//             // console.log(newUser);
//             res.redirect('/petitions');
//         }).catch(() => {
//             res.render('register', {
//                 layout: 'main',
//                 err : "Please fill all the fields"
//             });
//         });
// });

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

app.listen(8080, () => {
    console.log('listening  on port 8080');
});


function checkForSig( req, res, next) {
    !req.session.signatureId
        ? res.redirect('/')
        : next();
}

function checkForSig2( req, res, next) {
    req.session.signatureId
        ? res.redirect('/thanks')
        : next();
}
