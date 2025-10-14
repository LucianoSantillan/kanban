// kanban/Backend/src/entities/Task.js

const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Task",
    tableName: "tasks",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: "increment",
        },
        text: {
            type: "varchar",
        },
        status: {
            type: "enum",
            enum: ['To do', 'blocked', 'In progress', 'Ready for review', 'NO QA', 'READY FOR TESTING', 'DONE'],
            default: 'To do'
        },
    },
});