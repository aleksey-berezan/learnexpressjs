const express = require('express');
const seriesRouter = express.Router({ mergeParams: true });
const dbCallback = require('../utils/commonutils').dbCallback;

module.exports = seriesRouter;

const rowToSeries = row => {
    return {
        id: row.id,
        name: row.name,
        description: row.description
    }
};

const getSeriesById = (req, res, id, successStatus) => {
    req.db.get(`SELECT * FROM Series WHERE id=${id}`, dbCallback(res, (row) => {
        if (!row) {
            res.sendStatus(404);
            return;
        }

        const series = rowToSeries(row);
        res.status(successStatus || 200).send({ series });
    }));
};

// get
seriesRouter.param(':id', (req, res, next, id) => {
    req.seriesId = Number(id);
    next();
});

seriesRouter.get('/', (req, res, next) => {
    req.db.all(`SELECT * FROM Series`, dbCallback(res, (rows) => {
        const series = rows.map(rowToSeries);
        res.status(200).send({ series });
    }));
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
        dbCallback(res, (_, lastId) => {
            return getSeriesById(req, res, lastId, 201);
        }));
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
        dbCallback(res, () => {
            return getSeriesById(req, res, req.seriesId, 200);
        }));
});

// delete
seriesRouter.delete('/:id', (req, res, next) => {
    const seriesId = req.seriesId;
    req.db.get(`SELECT COUNT(*) as count FROM Issue WHERE series_id=${seriesId}`, dbCallback(res, (row) => {
        const count = row.count;
        if (count === undefined) {
            res.status(500).send('Error while counting issues');
            return;
        }

        if (count > 0) {
            res.status(400).send('Series has issues attached');
            return;
        }

        req.db.run(`DELETE FROM Series WHERE id=${seriesId}`, dbCallback(res, () => {
            return res.sendStatus(204);
        }));
    }));
});

//
// issues
//

seriesRouter.param(':issueId', (req, res, next, id) => {
    req.issueId = Number(id);
    next();
});

const getIssueById = (req, res, id, successStatus) => {
    req.db.get(`SELECT * FROM Series WHERE id=${id}`, dbCallback(res, (row) => {
        if (!row) {
            res.sendStatus(404);
            return;
        }

        const series = rowToSeries(row);
        res.status(successStatus || 200).send({ series });
    }));
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
    req.db.all(`SELECT Issue.* FROM Series Series LEFT OUTER JOIN Issue ON Series.id = Issue.series_id WHERE Series.id=${req.seriesId}`, dbCallback(res, (rows) => {
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
    }));
});

// post
seriesRouter.post('/:id/issues', (req, res, next) => {
    const issue = req.body.issue;
    const artistId = issue.artistId;

    if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId || !issue.seriesId) {
        res.sendStatus(400);
        return;
    }

    req.db.get(`SELECT COUNT(*) as count FROM Artist where id=${artistId}`, dbCallback(res, (row) => {
        if (row.count == 0) {
            res.sendStatus(400);
            return;
        }

        req.db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ('${issue.name}', '${issue.issueNumber}', '${issue.publicationDate}', '${issue.artistId}', '${issue.seriesId}')`,
            dbCallback(res, (_, lastId) => {
                req.db.get(`SELECT * FROM Issue WHERE id=${lastId}`, dbCallback(res, (row) => {
                    res.status(201).send({ issue: row });
                }));
            }));
    }));
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

    req.db.get(`SELECT COUNT(*) as count FROM Issue WHERE id=${issueId}`, dbCallback(res, (row) => {
        if (row.count == 0) {
            res.sendStatus(404);
            return;
        }

        req.db.get(`SELECT COUNT(*) as count FROM Series where id=${seriesId}`, dbCallback(res, (row) => {
            if (row.count == 0) {
                res.sendStatus(400);
                return;
            }

            req.db.get(`SELECT COUNT(*) as count FROM Artist where id=${artistId}`, dbCallback(res, (row) => {
                if (row.count == 0) {
                    res.sendStatus(400);
                    return;
                }

                req.db.run(`UPDATE Issue SET name='${issue.name}', issue_number=${issue.issueNumber},publication_date='${issue.publicationDate}',artist_id=${issue.artistId},series_id=${issue.seriesId} WHERE id=${issueId}`, dbCallback(res, (row) => {
                    req.db.get(`SELECT * FROM Issue WHERE id=${issueId}`, dbCallback(res, (row) => {
                        res.status(200).send({ issue: row });
                    }));
                }));
            }));
        }));
    }));
});

// delete
seriesRouter.delete('/:id/issues/:issueId', (req, res, next) => {
    const issueId = req.issueId;
    req.db.get(`SELECT COUNT(*) as count FROM Issue WHERE id=${issueId}`, dbCallback(res, (row) => {
        if (row.count == 0) {
            res.sendStatus(404);
            return;
        }

        req.db.run(`DELETE FROM Issue WHERE id=${issueId}`, dbCallback(res, (row) => {
            res.sendStatus(204);
        }));
    }));
});