const express = require('express');
const app = express();

//
// db
//
const sqlite3 = require('sqlite3');
let db;

const setDb = (newDb) => {
    db = newDb || new sqlite3.Database('./database.sqlite');
};

//
// Middleware
//

// cors
const cors = require('cors');
app.use(cors());

// request ody parsing
const bodyParser = require('body-parser');
app.use(bodyParser.json());

//
// routers declarations
//
// root - /api
const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.use('/', (req, res, next) => {
    req.db = db;
    next();
});

// ~/artists
const artistRouter = require('./src/routers/artists');
apiRouter.use('/artists', artistRouter);

// ~/series
const seriesRouter = require('./src/routers/series');
apiRouter.use('/series', seriesRouter);

//
// bootstrap
//
const PORT = process.env.PORT || 4001;
if (!module.parent) {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

//
// exports
//
module.exports = {
    app,
    setDb
};