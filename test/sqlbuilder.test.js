import {describe, test, expect} from 'vitest';
import {SqlBuilder} from '/src/SqlBuilder.js';


describe('sqlbuilder tests', () => {
    test('sanity check', () => {
        const builder = new SqlBuilder();
        expect(builder).toBeDefined();
    });

    test('will replace clause with clause', () => {
        const builder = new SqlBuilder();
        builder.where('s.test = true');
        const template = builder.addTemplate("select * from test s /**where**/");
        expect(template.rawSql).toBe("select * from test s WHERE s.test = true\n");
    });

    test('will chain multiple clauses', () => {
        const builder = new SqlBuilder();
        builder.where('s.test = true')
            .where('s.test = true');
        const template = builder.addTemplate("select * from test s /**where**/");
        expect(template.rawSql).toBe("select * from test s WHERE s.test = true AND s.test = true\n");
    });

    test('will apply params', () => {
        const builder = new SqlBuilder();
        builder.where('s.test = true')
            .where('s.test = true');
        const template = builder.addTemplate("select * from test s /**where**/ limit :limit", {limit: 10});
        expect(template.params).toStrictEqual({limit: 10});
    });

    test('will merge params', () => {
        const builder = new SqlBuilder();
        builder.where('s.test = :x', {x: "hello"})
            .where('s.test = :y', {y: "world"});
        const template = builder.addTemplate("select * from test s /**where**/ limit :limit", {limit: 10});
        expect(template.params).toStrictEqual({limit: 10, x: "hello", y: "world"});
    });

    test('will merge params when some are undefined', () => {
        const builder = new SqlBuilder();
        builder.where('s.test = :x', {x: "hello"})
            .where("s.test = 'world'");
        const template = builder.addTemplate("select * from test s /**where**/ limit :limit", {limit: 10});
        expect(template.params).toStrictEqual({limit: 10, x: "hello"});
    });


    test('will merge params when template params are undefined', () => {
        const builder = new SqlBuilder();
        builder.where('s.test = :x', {x: "hello"})
            .where("s.test = 'world'");
        const template = builder.addTemplate("select * from test s /**where**/");
        expect(template.params).toStrictEqual({x: "hello"});
    });

    test('will replace multiple clause types', () => {
        const builder = new SqlBuilder();
        builder.where('s.test = :x', {x: "hello"})
            .orderBy("column");
        const template = builder.addTemplate("select * from test s /**where**/ /**orderby**/");
        expect(template.rawSql).toBe("select * from test s WHERE s.test = :x\n ORDER BY column\n");
    });
});