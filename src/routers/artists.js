const express = require('express');
const artistsRouter = express.Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite');

module.exports = artistsRouter;

const handleFailure = (err, res, status, message) => {
    if (!err) {
        return false;
    }

    console.log(err);
    if (!res) {
        throw err;
    }

    res.status(status || 500);
    res.send(message || err);
    return true;
};

const rowToArtist = row => {
    return {
        id: row.id,
        name: row.name,
        date_of_birth: row.date_of_birth,
        biography: row.biography,
        is_currently_employed: row.is_currently_employed
    }
};

artistsRouter.param(':id', (req, res, next, id) => {
    req.artistId = Number(id);
    next();
});

artistsRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Artist`, (err, rows) => {
        if (handleFailure(err, res)) {
            return;
        }

        const artists = rows.map(rowToArtist);
        res.status(200).send({ artists });
    });
});

artistsRouter.get('/:id', (req, res, next) => {
    db.get(`SELECT * FROM Artist WHERE id=$id`, { $id: req.artistId }, (err, row) => {
        if (handleFailure(err, res)) {
            return;
        }

        if (!row) {
            res.sendStatus(404);
            return;
        }

        const artist = rowToArtist(row);
        res.status(200).send({ artist });
    });
});