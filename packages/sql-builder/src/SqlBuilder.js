export class SqlBuilder {

    #template = '';
    /** @type {string[]} */
    #params = [];
    /** @type {Map<string, Clauses>} */
    data = new Map();

    get rawSql() {
        return this.#template;
    }

    get params() {
        return this.#params;
    }

    /**
     * @param params {object?}
     * @param sql {string}
     */
    addTemplate(sql, params) {
        return new Template(this, sql, params);
    }

    /**
     *
     * @param sql {string}
     * @param params {object | null}
     * @returns {SqlBuilder}
     */
    where(sql, params = null) {
        return this.#addClause("where", sql, params, " AND ", "WHERE ", "\n");
    }

    /**
     *
     * @param sql {string}
     * @param params {object?}
     * @returns {SqlBuilder}
     */
    orderBy(sql, params) {
        return this.#addClause("orderby", sql, params, ", ", "ORDER BY ", "\n");
    }

    /**
     *
     * @param name {string}
     * @param sql {string}
     * @param params {object?}
     * @param joiner {string}
     * @param prefix {string}
     * @param postfix {string}
     */
    #addClause(name, sql, params, joiner, prefix = "", postfix = "") {
        let clauses = this.data.get(name);
        if (!clauses) {
            clauses = new Clauses(joiner, prefix, postfix);
            this.data.set(name, clauses);
        }
        clauses.add({sql, params});
        return this;
    }
}


class Template {
    /** @type {SqlBuilder} **/
    #builder;
    /** @type {string} **/
    #template;
    /** @type {object} **/
    #params;
    #resolved = false;
    #rawSql = "";

    /**
     * @param builder {SqlBuilder}
     * @param sql {string}
     * @param params {object | null}
     */
    constructor(builder, sql, params) {
        this.#builder = builder;
        this.#template = sql;
        this.#params = params ?? {};
    }

    /**
     * @returns {string}
     */
    get rawSql() {
        if (!this.#resolved) {
            this.#resolveSql();
        }
        return this.#rawSql;
    }

    /**
     *
     * @returns {object}
     */
    get params() {
        if (!this.#resolved) {
            this.#resolveSql();
        }
        return this.#params;
    }

    #resolveSql() {
        let rawSql = this.#template;
        for (const [name, clauses] of this.#builder.data) {
            rawSql = rawSql.replace(`/**${name}**/`, clauses.resolve(this.#params));
        }
        this.#rawSql = rawSql;
        this.#resolved = true;
    }

}

/**
 * @typedef {object} Clause
 * @property sql {string}
 * @property params {object | null}
 */

class Clauses {
    /** @type {Clause[]} */
    #data = [];
    /** @type {string} */
    #joiner;
    /** @type {string} */
    #prefix;
    /** @type {string} */
    #postfix;

    /**
     * @param joiner {string}
     * @param prefix {string}
     * @param postfix {string}
     */
    constructor(joiner, prefix, postfix) {
        this.#prefix = prefix;
        this.#postfix = postfix;
        this.#joiner = joiner;
    }

    /**
     * @param clause {Clause}
     */
    add(clause) {
        this.#data.push(clause);
    }

    /**
     * @param parameters {object}
     * @returns {string}
     */
    resolve(parameters) {
        for (const item of this.#data) {
            Object.assign(parameters, item.params);
        }
        return this.#prefix + this.#data.map(x => x.sql).join(this.#joiner) + this.#postfix;
    }
}

