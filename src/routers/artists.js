const express = require('express');
const artistsRouter = express.Router({ mergeParams: true });

module.exports = artistsRouter;

// common
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

// get
artistsRouter.param(':id', (req, res, next, id) => {
    req.artistId = Number(id);
    next();
});

artistsRouter.get('/', (req, res, next) => {
    req.db.all(`SELECT * FROM Artist`, (err, rows) => {
        if (handleFailure(err, res)) {
            return;
        }

        const artists = rows.map(rowToArtist);
        res.status(200).send({ artists });
    });
});

const getArtistById = (req, res, id, successStatus) => {
    req.db.get(`SELECT * FROM Artist WHERE id=$id`, { $id: id }, (err, row) => {
        if (handleFailure(err, res)) {
            return;
        }

        if (!row) {
            res.sendStatus(404);
            return;
        }

        const artist = rowToArtist(row);
        res.status(successStatus || 200).send({ artist });
    });
};

artistsRouter.get('/:id', (req, res, next) => {
    return getArtistById(req, res, req.artistId, 200);
});

// post
artistsRouter.post('/', (req, res, next) => {
    const newArtist = req.body.artist;
    if (!newArtist.name || !newArtist.dateOfBirth || !newArtist.biography) {
        res.sendStatus(400);
        return;
    }

    req.db.run(`INSERT INTO Artist (name, date_of_birth, biography) VALUES ('${newArtist.name}', '${newArtist.dateOfBirth}', '${newArtist.biography}')`,
        function (err) {
            if (handleFailure(err, res)) {
                return;
            }

            return getArtistById(req, res, this.lastID, 201);
        });
});

// put
artistsRouter.put('/:id', (req, res, next) => {
    const updatedArtist = req.body.artist;
    if (!updatedArtist.name || !updatedArtist.dateOfBirth || !updatedArtist.biography) {
        res.sendStatus(400);
        return;
    }

    // TODO: parametrize
    req.db.run(`UPDATE Artist SET name='${updatedArtist.name}', date_of_birth='${updatedArtist.dateOfBirth}', biography='${updatedArtist.biography}' WHERE id=${req.artistId}`,
        function (err) {
            if (handleFailure(err, res)) {
                return;
            }

            return getArtistById(req, res, req.artistId, 200);
        });
});

// delete
artistsRouter.delete('/:id', (req, res, next) => {
    // const updatedArtist = req.body.artist;
    // if (!updatedArtist.name || !updatedArtist.dateOfBirth || !updatedArtist.biography) {
    //     res.sendStatus(400);
    //     return;
    // }

    req.db.run(`UPDATE Artist SET is_currently_employed=0 WHERE id=${req.artistId}`,
        function (err) {
            if (handleFailure(err, res)) {
                return;
            }

            return getArtistById(req, res, req.artistId, 200);
        });
});