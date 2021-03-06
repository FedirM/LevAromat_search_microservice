const express   = require('express');
const cors      = require('cors');
const mysql     = require('mysql');

require('dotenv').config({ path: '.env' });
const app = express();
const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// CORS
app.use( cors() );


mysqlConnection.connect((err) => {
    if( err ) {
        console.log('\x1b[31mService:\x1b[0m MySQL failed');
        console.log(err);
    } else {
        console.log(`\x1b[32mService:\x1b[0m MySQL connected`);
    }
});

function reflect( promise ) {
    return promise.then(
        (v) => {return {value: v, status: 'resolved'};},
        (e) => {return {value: e, status: 'rejected'};});
}


app.get('/search', function (req, res) {
    // if( !req.query.q || !req.query.priceType ) return res.sendStatus(400);
    // AND prices.organisation_id = '${req.query.priceType}'
    reflect( new Promise((resolve, reject) => {
        mysqlConnection.query(`SELECT distinct(product.product_id), product.name FROM product, prices
WHERE product.product_id = prices.product_id
AND prices.cost > 0
AND (lower(product.name) LIKE '%${req.query.q.toLowerCase()}%' OR product.vendor LIKE '%${req.query.q.toLowerCase()}%' OR product.slug LIKE '%${req.query.q.toLowerCase()}%' OR lower(product.description) LIKE '%${req.query.q.toLowerCase()}%')`, (err, mysqlRes) => {
            if( err ){
                console.log("ERR: ", err);
                reject( err );
            } else {
                // console.log('RES: ', mysqlRes);
                resolve( mysqlRes );
            }
        });
    })).then((mysqlRes) => {
        if( mysqlRes.status === 'rejected' ){
            res.status(500).send('Pizdech na servere...');
        } else {
            res.status(200).send( { amount: mysqlRes.value.length, array: mysqlRes.value } );
        }
    })
});



app.listen(process.env.PORT, (err) => {
    if( err ){
        console.log( err );
    }
    console.log('\x1b[31m-----------------------------------\x1b[0m');
    console.log(`\x1b[32mService:\x1b[0m server is up on port ${process.env.PORT}`);
});
