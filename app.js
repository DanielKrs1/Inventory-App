//set up the server
const express = require( "express" );
const app = express();
const logger = require("morgan");
const dotenv = require('dotenv');
dotenv.config();
const helmet = require("helmet");
const db = require('./db/db_pool');
const port = process.env.PORT || 8080;
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use( express.urlencoded({ extended: false }) );
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'cdnjs.cloudflare.com']
      }
    }
  }));

// auth router attaches /login, /logout, and /callback routes to the baseURL
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

app.use(auth(config));
// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
    console.log(__dirname);
} );

// define middleware that logs all incoming requests
app.use(logger("dev"));
// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));
// Configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

// req.isAuthenticated is provided from the auth router
app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.render('index', {
        isLoggedIn : req.oidc.isAuthenticated(),
        user : req.oidc.user
     });
});

// define a route for item Create
const create_item_sql = `
    INSERT INTO stuff
        (item, quantity, description, userid)
    VALUES
        (?, ?, ?, ?)
`
app.post("/inventory", requiresAuth(), ( req, res ) => {
    db.execute(create_item_sql, [req.body.name, req.body.quantity, req.body.description, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (id) of the newly inserted element.
            res.redirect(`/inventory/item/${results.insertId}`);
        }
    });
})

// define a route for the stuff inventory page`
const read_stuff_all_sql = `
SELECT 
    id, item, quantity, description
FROM
    stuff
WHERE
    userid = ?
`
app.get( "/inventory", requiresAuth(), ( req, res ) => {
    db.execute(read_stuff_all_sql, [req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
            else {
                res.render('inventory', { inventory : results });
        }
    });
} );

// define a route for the item detail page
const read_item_sql = `
    SELECT 
        id, item, quantity, description 
    FROM
        stuff
    WHERE
        id = ?
    AND
        userid = ?
    `
app.get( "/inventory/item/:id", requiresAuth(), ( req, res ) => {
    db.execute(read_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
        res.status(500).send(error); //Internal Server Error
        else if (results.length == 0)
        res.status(404).send(`No item found with id = "${req.params.id}"` ); // NOT FOUND
        else {
        let data = results[0]; // results is still an array
        // data's object structure: 
        //  { item: ___ , quantity:___ , description: ____ }
        res.render('itemEdit', data);
        }
    });
});

// define a route for item UPDATE
const update_item_sql = `
    UPDATE
        stuff
    SET
        item = ?,
        quantity = ?,
        description = ?
    WHERE
        id = ?
    AND
        userid = ?
`
app.post("/inventory/item/:id", requiresAuth(), ( req, res ) => {
    db.execute(update_item_sql, [req.body.name, req.body.quantity, req.body.description, req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/inventory/item/${req.params.id}`);
        }
    });
})

// define a route for item DELETE
const delete_item_sql = `
    DELETE FROM
        stuff
    WHERE
        id = ?
    AND
        userid = ?
`
app.get("/inventory/item/:id/delete", requiresAuth(), ( req, res ) => {
    db.execute(delete_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/inventory");
        }
    });
})