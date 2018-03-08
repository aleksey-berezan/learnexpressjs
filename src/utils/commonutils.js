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

// db
const dbCallback = (res, callback) => {
    // critical to have it as plain old 'function' - in sake of access to 'this.lastID'
    return function (err, dbResult) {
        if (handleFailure(err, res)) {
            return;
        }

        callback(dbResult, this.lastID);
    };
};

// exports
module.exports = {
    dbCallback: dbCallback
};