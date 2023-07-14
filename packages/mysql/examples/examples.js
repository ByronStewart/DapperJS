import {MySqlClient} from "../src/MySqlClient.js";

const conn = new MySqlClient({
    namedPlaceholders: true, host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'classicmodels',
});

async function main() {
    await conn.open();
    /**
     * @type {{employeeNumber: number, firstName: string, lastName: string, jobTitle: string, customers: Array<{customerNumber: number, customerName: string}>} | undefined}
     */
    let employee = undefined;
    await conn.query(
        `select c.customerNumber,
               c.customerName,
               e.employeeNumber,
               e.firstName,
               e.lastName,
               e.jobTitle
        from customers c
                 inner join employees e
                            on c.salesRepEmployeeNumber = e.employeeNumber
                                and employeeNumber = 1165`,
        null,
        (row) => {
            if (!employee) {
                employee = {
                    employeeNumber: row.employeeNumber,
                    jobTitle: row.jobTitle,
                    lastName: row.lastName,
                    customers: [],
                    firstName: row.firstName
                };
            }
            employee.customers.push({customerName: row.customerName, customerNumber: row.customerNumber});
        });
    console.log(employee);


    const customerNumber = await conn.queryFirstOrDefault(
        `select c.customerNumber from customers c`,
        null,
        0
    );
    console.log(customerNumber);

    const customerFail = await conn.querySingleOrDefault(
        `select c.customerNumber from customers c`,
        null,
        0
    );
    console.log(customerFail);

    /**
     * @type {Map<number,{employeeNumber: number, firstName: string, lastName: string, jobTitle: string, customers: Array<{customerNumber: number, customerName: string}>}>}
     */
    let employees = new Map();
    await conn.query(
        `select c.customerNumber,
               c.customerName,
               e.employeeNumber,
               e.firstName,
               e.lastName,
               e.jobTitle 
        from customers c
                 inner join employees e
                            on c.salesRepEmployeeNumber = e.employeeNumber`,
        null,
        (/** @type {any} */row) => {
            if (!employees.has(row.employeeNumber)) {
                employee = {
                    employeeNumber: row.employeeNumber,
                    jobTitle: row.jobTitle,
                    lastName: row.lastName,
                    customers: [],
                    firstName: row.firstName
                };
                employees.set(row.employeeNumber, employee);
            } else {
                employee = employees.get(row.employeeNumber);
            }
            // @ts-ignore
            employee.customers.push({customerName: row.customerName, customerNumber: row.customerNumber});
        });

    conn.conn.query('insert into ');
}

main().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});