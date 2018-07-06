const spicedPg = require('spiced-pg');

const db = spicedPg('postgres:Victor:postgres@localhost:5432/petition');

exports.getSigners = function () {
    return db.query('SELECT * FROM signatures')
        .then(results => {
            return(results.rows);
        }).catch(err => {
            console.log(err);
        });
};

exports.insertSigner = function (firstName, lastName, signatureN) {
    const q = `
        iNSERT INTO signatures (first_name, last_name, signature)
            VALUES ($1, $2, $3)
            RETURNING *
    `;
    const params = [ firstName || null , lastName || null, signatureN || null];
    return db.query(q, params)
        .then(results => {
            return results.rows[0];
        })
        .catch(err => {
            // console.log("this is workinggggggggggggggggg");
            return Promise.reject(err);
        });
};

exports.insertUser = function (firstName, lastName, email, password) {
    const q = `
        iNSERT INTO users (first_name, last_name, email, hashed_password)
            VALUES ($1, $2, $3, $4)
            RETURNING *
    `;
    const params = [ firstName || null , lastName || null, email || null, password || null];
    return db.query(q, params)
        .then(results => {
            return results.rows[0];
        })
        .catch(err => {
            // console.log("this is workinggggggggggggggggg");
            return Promise.reject(err);
        });
};

exports.getYourSignature = function (id) {
    const q = `
        SELECT * FROM signatures WHERE id = $1
    `;
    const params = [id];
    return db.query(q, params)
        .then(results => {
            return results.rows[0];
        });
};
