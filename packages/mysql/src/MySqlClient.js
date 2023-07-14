import {createConnection} from "mysql2";


export class MySqlClient {

    /**
     * Creates a new instance of the Database class.
     * @param {import('mysql2').ConnectionOptions} config - The MySQL Connection object.
     */
    constructor(config) {
        /**
         * The MySQL Connection object.
         * @type {import('mysql2').Connection}
         */
        this.conn = createConnection({...config, namedPlaceholders: true});
    }

    /**
     * @template T
     * @param {T[]} result
     * @param {any?} defaultValue
     */
    static #firstResultOrDefault(result, defaultValue) {
        if (!result[0]) {
            return defaultValue ?? null;
        }
        for (const [_, value] of Object.entries(result[0])) {
            switch (typeof defaultValue) {
                case "number":
                    return Number.parseFloat(value);
                case "boolean":
                    return Boolean(value);
                case "string":
                    return value.toString();
                default:
                    return value;
            }
        }
    }

    /**
     * @template T
     * @param {T[]} result
     * @param takeFirstProp {boolean}
     */
    static #firstResultOrThrow(result, takeFirstProp) {
        if (!result[0]) {
            throw new Error('No result found');
        }
        if (takeFirstProp) {
            for (const [_, value] of Object.entries(result[0])) {
                return value;
            }
        }
        return result[0];

    }

    /**
     * Open a database connection
     * @returns {Promise<void>}
     * @throws {import('mysql2').QueryError}
     */
    async open() {
        return new Promise((resolve, reject) => {
            this.conn.connect(e => {
                if (e) return reject(e);
                return resolve();
            });
        });
    }

    /**
     * Close the database connection
     * @returns {Promise<void>}
     * @throws {import('mysql2').QueryError}
     */
    async close() {
        return new Promise((resolve, reject) => {
            this.conn.end(e => {
                if (e) return reject(e);
                return resolve();
            });
        });
    }

    /**
     * @template TQuery
     * @template TResult
     * @param {string} sql
     * @param {any} params
     * @param {(x: any) => TResult} map
     */
    async query(sql, params, map) {
        return new Promise((resolve, reject) => {
            this.conn.query(sql, params, (e, result, fields) => {
                if (e) return reject(e);
                if (map) { // @ts-ignore
                    return resolve(result.map(map));
                }
                return resolve(result);
            });

        });
    }

    /**
     * @template T
     * @param {string} sql
     * @param {any} params
     * @param options {{coercePrimitive: boolean}}
     */
    async queryFirst(sql, params, options = {coercePrimitive: false}) {
        return new Promise((resolve, reject) => {
            this.conn.query(sql, params, (e, result, fields) => {
                if (e) return reject(e);
                if (!Array.isArray(result)) throw Error('Query of incorrect form');
                return resolve(MySqlClient.#firstResultOrThrow(/** @type {T[]} */ (result), options.coercePrimitive));
            });
        });
    }

    /**
     * @template T
     * @param {string} sql
     * @param {any} params
     * @param defaultValue {any}
     */
    async queryFirstOrDefault(sql, params, defaultValue = null) {
        return new Promise((resolve, reject) => {
            this.conn.query(sql, params, (e, result, fields) => {
                if (e) return reject(e);
                return resolve(MySqlClient.#firstResultOrDefault(/** @type {T[]} */ (result), defaultValue));
            });

        });
    }

    /**
     * @template T
     * @param {string} sql
     * @param {any} params
     * @param defaultValue {any}
     */
    async querySingleOrDefault(sql, params, defaultValue = null) {
        return new Promise((resolve, reject) => {
            this.conn.query(sql, params, (e, result, fields) => {
                if (e) return reject(e);
                if (!Array.isArray(result)) throw Error('Query of incorrect form');
                if (result.length > 1) throw Error('Query returned more than a single result');
                return resolve(MySqlClient.#firstResultOrDefault(/** @type {T[]} */ (result), defaultValue));
            });
        });
    }

    /**
     * @template T
     * @param {string} sql
     * @param {any} params
     * @param options {{coercePrimitive: boolean}}
     */
    async querySingle(sql, params, options = {coercePrimitive: false}) {
        return new Promise((resolve, reject) => {
            this.conn.query(sql, params, (e, result, fields) => {
                if (e) reject(e);
                if (!Array.isArray(result)) throw Error('Query of incorrect form');
                if (result.length > 1) throw Error('Query returned more than a single result');
                return resolve(MySqlClient.#firstResultOrThrow(/** @type {T[]} */ (result), options.coercePrimitive));
            });
        });
    }


}