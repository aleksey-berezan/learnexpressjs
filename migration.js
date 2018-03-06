const sqlite3 = require('sqlite3');

const dropTableArtist = 'DROP TABLE IF EXISTS Artist';
const createTableArtist = 'CREATE TABLE Artist' +
    '(' +
    '    id INTEGER NOT NULL,' +
    '    name TEXT NOT NULL,' +
    '    date_of_birth TEXT NOT NULL,' +
    '    biography TEXT NOT NULL,' +
    '    is_currently_employed INTEGER DEFAULT 1,' +
    '    PRIMARY KEY(id)' +
    ')';
const dropTableSeries = 'DROP TABLE IF EXISTS Series';
const createTableSeries = 'CREATE TABLE Series' +
    '(' +
    '    id INTEGER NOT NULL,' +
    '    name TEXT NOT NULL,' +
    '    description TEXT NOT NULL,' +
    '    PRIMARY KEY(id)' +
    ')';
const dropTableIssues = 'DROP TABLE IF EXISTS Issue';
const createTableIssues = 'CREATE TABLE Issue' +
    '(' +
    '    id INTEGER NOT NULL,' +
    '    name TEXT NOT NULL,' +
    '    issue_number TEXT NOT NULL,' +
    '    publication_date TEXT NOT NULL,' +
    '    artist_id INTEGER NOT NULL,' +
    '    series_id INTEGER NOT NULL,' +
    ' ' +
    '    CONSTRAINT fk_artist_id FOREIGN KEY (artist_id) REFERENCES Artist (id),' +
    '    CONSTRAINT fk_series_id FOREIGN KEY (series_id) REFERENCES Series (id),' +
    '    PRIMARY KEY(id)' +
    ')';

const handleError = (error) => {
    if (error) {
        throw error;
    }
};

const initializeDb = (db) => {
    const seedDb = db || new sqlite3.Database('./database.sqlite');
    seedDb.serialize(function () {
        seedDb.run(dropTableArtist, handleError);
        seedDb.run(createTableArtist, handleError);

        seedDb.run(dropTableSeries, handleError);
        seedDb.run(createTableSeries, handleError);

        seedDb.run(dropTableIssues, handleError);
        seedDb.run(createTableIssues, handleError);
    });
};

module.exports = initializeDb;