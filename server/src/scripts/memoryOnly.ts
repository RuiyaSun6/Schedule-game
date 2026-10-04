// Import this FIRST in unit tests that call services directly. It forces in-memory storage, so a
// configured server/.env can never send test data to the real TiDB (dotenv never overrides a
// variable that is already set, and an empty TIDB_HOST means "TiDB disabled").
process.env.TIDB_HOST = "";
