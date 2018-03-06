const express = require('express');
const app = express();
module.exports = app;

const PORT = process.env.PORT || 4001;

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

// --/artists
const artistRouter = require('./src/routers/artists');
apiRouter.use('/artists', artistRouter);

//
// bootstrap
//
if (!module.parent) {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}



