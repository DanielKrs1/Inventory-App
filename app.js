//set up the server
const express = require( "express" );
const logger = require("morgan");
const db = require("./db/db_pool")
const helmet = require("helmet")
const app = express();
const port = process.env.PORT || 8080;
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

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
app.use( express.urlencoded({ extended: false }) );
//set up helmet middleware to pretect against basic vulnerabilities
app.use(helmet());
// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.render('index');
});

// define a route for item Create
const create_item_sql = `
    INSERT INTO stuff
        (item, quantity, description)
    VALUES
        (?, ?, ?)
`
app.post("/inventory", ( req, res ) => {
    db.execute(create_item_sql, [req.body.name, req.body.quantity, req.body.description], (error, results) => {
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
`
app.get( "/inventory", ( req, res ) => {
    db.execute(read_stuff_all_sql, (error, results) => {
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
    `
app.get( "/inventory/item/:id", ( req, res ) => {
    db.execute(read_item_sql, [req.params.id], (error, results) => {
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
`
app.post("/inventory/item/:id", ( req, res ) => {
    db.execute(update_item_sql, [req.body.name, req.body.quantity, req.body.description, req.params.id], (error, results) => {
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
`
app.get("/inventory/item/:id/delete", ( req, res ) => {
    db.execute(delete_item_sql, [req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/inventory");
        }
    });
})