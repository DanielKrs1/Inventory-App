// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

const drop_stuff_table_sql = "DROP TABLE IF EXISTS `stuff`;"
db.execute(drop_stuff_table_sql);

const create_stuff_table_sql = `
    CREATE TABLE stuff (
        id INT NOT NULL AUTO_INCREMENT,
        item VARCHAR(45) NOT NULL,
        quantity INT NOT NULL,
        description VARCHAR(150) NULL,
        PRIMARY KEY (id)
    );`
db.execute(create_stuff_table_sql);

/**** Create some sample items ****/
const insert_stuff_table_sql = `
    INSERT INTO stuff 
        (item, quantity, description) 
    VALUES 
        (?, ?, ?);
`
db.execute(insert_stuff_table_sql, ['Amogus', '7', 'The sussiest of bakas']);
db.execute(insert_stuff_table_sql, ['Morbius 2', '200', 'Truly one of the sequels of all time']);
db.execute(insert_stuff_table_sql, ['Person who Asked', '0', 'Nobody asked']);

/**** Read the sample items inserted ****/
const read_stuff_table_sql = "SELECT * FROM stuff";

db.execute(read_stuff_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'stuff' initialized with:")
        console.log(results);
    }
);
db.end();