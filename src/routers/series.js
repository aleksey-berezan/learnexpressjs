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

// delete
seriesRouter.delete('/:id', (req, res, next) => {
    const seriesId = req.seriesId;
    req.db.get(`SELECT COUNT(*) as count FROM Issue WHERE series_id=${seriesId}`, (err, row) => {
        if (handleFailure(err, res)) {
            return;
        }
        const count = row.count;
        if (count === undefined) {
            res.status(500).send('Error while counting issues');
            return;
        }

        if (count > 0) {
            res.status(400).send('Series has issues attached');
            return;
        }

        req.db.run(`DELETE FROM Series WHERE id=${seriesId}`, (err) => {
            if (handleFailure(err, res)) {
                return;
            }

            return res.sendStatus(204);
        });
    });
});

//
// issues
//

seriesRouter.param(':issueId', (req, res, next, id) => {
    req.issueId = Number(id);
    next();
});

const getIssueById = (req, res, id, successStatus) => {
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

const rowToIssue = (row) => {
    return {
        id: row.id,
        name: row.name,
        issueNumber: row.issue_number,
        publicationDate: row.publication_date,
        artistId: row.artist_id,
        seriesId: row.series_id
    };
};

// get
seriesRouter.get('/:id/issues', (req, res, next) => {
    req.db.all(`SELECT Issue.* FROM Series Series LEFT OUTER JOIN Issue ON Series.id = Issue.series_id WHERE Series.id=${req.seriesId}`, (err, rows) => {
        if (handleFailure(err, res)) {
            return;
        }

        if (!rows) {
            res.sendStatus(500);
            return;
        }

        if (rows.length == 0) {
            res.sendStatus(404);
            return;
        }

        const issues = rows.filter(issue => issue.id);
        res.status(200).send({ issues });
    });
});

// post
seriesRouter.post('/:id/issues', (req, res, next) => {
    const issue = req.body.issue;
    const artistId = issue.artistId;

    if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId || !issue.seriesId) {
        res.sendStatus(400);
        return;
    }

    req.db.get(`SELECT COUNT(*) as count FROM Artist where id=${artistId}`, (err, row) => {
        if (handleFailure(err, res)) {
            return;
        }

        if (row.count == 0) {
            res.sendStatus(400);
            return;
        }

        req.db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ('${issue.name}', '${issue.issueNumber}', '${issue.publicationDate}', '${issue.artistId}', '${issue.seriesId}')`, function (err, row) {
            if (handleFailure(err, res)) {
                return;
            }

            const lastId = this.lastID;
            req.db.get(`SELECT * FROM Issue WHERE id=${lastId}`, (err, row) => {
                if (handleFailure(err, res)) {
                    return;
                }

                res.status(201).send({ issue: row });
            });
        });
    });
});

// put
seriesRouter.put('/:id/issues/:issueId', (req, res, next) => {
    const issue = req.body.issue;
    const issueId = req.issueId;
    const artistId = issue.artistId;
    const seriesId = issue.seriesId;

    if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId || !issue.seriesId) {
        res.sendStatus(400);
        return;
    }

    req.db.get(`SELECT COUNT(*) as count FROM Issue WHERE id=${issueId}`, (err, row) => {
        if (handleFailure(err, res)) {
            return;
        }

        if (row.count == 0) {
            res.sendStatus(404);
            return;
        }

        req.db.get(`SELECT COUNT(*) as count FROM Series where id=${seriesId}`, (err, row) => {
            if (handleFailure(err, res)) {
                return;
            }

            if (row.count == 0) {
                res.sendStatus(400);
                return;
            }

            req.db.get(`SELECT COUNT(*) as count FROM Artist where id=${artistId}`, (err, row) => {
                if (handleFailure(err, res)) {
                    return;
                }

                if (row.count == 0) {
                    res.sendStatus(400);
                    return;
                }

                req.db.run(`UPDATE Issue SET name='${issue.name}', issue_number=${issue.issueNumber},publication_date='${issue.publicationDate}',artist_id=${issue.artistId},series_id=${issue.seriesId} WHERE id=${issueId}`, function (err, row) {
                    if (handleFailure(err, res)) {
                        return;
                    }

                    req.db.get(`SELECT * FROM Issue WHERE id=${issueId}`, (err, row) => {
                        if (handleFailure(err, res)) {
                            return;
                        }

                        res.status(200).send({ issue: row });
                    });
                });
            });
        });
    });
});

// delete
seriesRouter.delete('/:id/issues/:issueId', (req, res, next) => {
    const issueId = req.issueId;

    req.db.get(`SELECT COUNT(*) as count FROM Issue WHERE id=${issueId}`, (err, row) => {
        if (handleFailure(err, res)) {
            return;
        }

        if (row.count == 0) {
            res.sendStatus(404);
            return;
        }

        req.db.run(`DELETE FROM Issue WHERE id=${issueId}`, (err, row) => {
            if (handleFailure(err, res)) {
                return;
            }

            res.sendStatus(204);
        });
    });
});