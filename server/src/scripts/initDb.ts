import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { databaseName, getPool, serverConfig } from "../db/tidb.js";

// TiDB Serverless only ships with `test`, so create our database first.
const admin = await mysql.createConnection(serverConfig());
await admin.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName()}\``);
await admin.end();

const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
await getPool().query(sql);
console.log("TiDB schema ready.");
await getPool().end();
