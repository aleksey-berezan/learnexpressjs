const express = require('express');
const seriesRouter = express.Router({ mergeParams: true });

module.exports = seriesRouter;

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

const rowToSeries = row => {
    return {
        id: row.id,
        name: row.name,
        description: row.description
    }
};

const getSeriesById = (req, res, id, successStatus) => {
    req.db.get(`SELECT * FROM Series WHERE id=${id}`, (err, row) => {
        if (handleFailure(err, res)) {
            return;
        }

        if (!row) {
            res.sendStatus(404);
            return;
        }

        const series = rowToSeries(row);
        res.status(successStatus || 200).send({ series });
    });
};

// get
seriesRouter.param(':id', (req, res, next, id) => {
    req.seriesId = Number(id);
    next();
});

seriesRouter.get('/', (req, res, next) => {
    req.db.all(`SELECT * FROM Series`, (err, rows) => {
        if (handleFailure(err, res)) {
            return;
        }

        const series = rows.map(rowToSeries);
        res.status(200).send({ series });
    });
});

seriesRouter.get('/:id', (req, res, next) => {
    return getSeriesById(req, res, req.seriesId, 200);
});

seriesRouter.get('/:id/issues', (req, res, next) => {
    return res.status(200).send({ issues: [] });
});

// post
seriesRouter.post('/', (req, res, next) => {
    const newSeries = req.body.series;
    if (!newSeries.name || !newSeries.description) {
        res.sendStatus(400);
        return;
    }

    req.db.run(`INSERT INTO Series (name, description) VALUES ('${newSeries.name}', '${newSeries.description}')`,
        function (err) {
            if (handleFailure(err, res)) {
                return;
            }

            return getSeriesById(req, res, this.lastID, 201);
        });
});

// put
seriesRouter.put('/:id', (req, res, next) => {
    const updatedSeries = req.body.series;
    if (!updatedSeries.name || !updatedSeries.description) {
        res.sendStatus(400);
        return;
    }

    // TODO: parametrize
    req.db.run(`UPDATE Series SET name='${updatedSeries.name}', description='${updatedSeries.description}' WHERE id=${req.seriesId}`,
        function (err) {
            if (handleFailure(err, res)) {
                return;
            }

            return getSeriesById(req, res, req.seriesId, 200);
        });
});