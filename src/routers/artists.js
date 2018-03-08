const express = require('express');
const dbCallback = require('../utils/commonutils').dbCallback;
const artistsRouter = express.Router({ mergeParams: true });

module.exports = artistsRouter;

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
    req.db.all(`SELECT * FROM Artist`, dbCallback(res, (rows) => {
        const artists = rows.map(rowToArtist);
        res.status(200).send({ artists });
    }));
});

const getArtistById = (req, res, id, successStatus) => {
    req.db.get(`SELECT * FROM Artist WHERE id=$id`, { $id: id }, dbCallback(res, (row) => {
        if (!row) {
            res.sendStatus(404);
            return;
        }

        const artist = rowToArtist(row);
        res.status(successStatus || 200).send({ artist });
    }));
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
        dbCallback(res, (_, lastId) => {
            return getArtistById(req, res, lastId, 201);
        }));
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
        dbCallback(res, () => {
            return getArtistById(req, res, req.artistId, 200);
        }));
});

// delete
artistsRouter.delete('/:id', (req, res, next) => {
    req.db.run(`UPDATE Artist SET is_currently_employed=0 WHERE id=${req.artistId}`,
        dbCallback(res, () => {
            return getArtistById(req, res, req.artistId, 200);
        }));
});