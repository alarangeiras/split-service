## About
This service is responsible for handling split payments across multiple group members.

## How it works

### Entities
- Groups are a way of create small portion of people. It could be since a small group of friends to a company vertical.
- Members are people who joined a group. For the sake simplicity, this app doesn´t handle members moviment across groups, or being removed from them.
- Expenses are anything that was bought by a group member and should be splitted by the remaining members (or a smaller cohort).
- Trasactions are any money moviment added or removed from anyone's wallet. It can be positive or negative
- Balance is the current transactions status. It's the sum of their amounts and can be positive or negative
- Settlement is a transaction between two group managers, they can settle a money transfer which is gonna create two transactions (1 positive and 1 negative) which will impact on their balances.

### Tech and libraries

- docker/compose for mocking external dependencies (I decided to no keep the app in a container during the development for the sake of simplicity)
- postgresql for the local DB (it could be a mysql for example, since I didn't used any native postgres feature). I chose a SQL DB since the schema looks like well defined
- redis for caching. The balances doesn't look like changing very offen, so I used redis cache to avoid hitting the DB all the time. To avoid inconsistencies any endpoint that changes transactions (which will impact the balances), automatically invalidates the cache
- localstack for mocking AWS resources. I used S3 to store the CSV (presigned url) and SNS to send notification events (emails)
- knexjs for DB DML/DDL. It's not a ORM, but it already takes care of SQL injection and it's pretty great straightforward library. It could be Sequelize in this case, but i personally thing Sequelize is more complex for this case. It also offers a nice DB migration structure, which keeps the DB very reproducible in many environments.
- luxon for date/time manipulation
- pino for logging
- zod for request validation (with some validation middlewares, now I think it could be only one middleware)
- supertest for integration tests
- a couple of bash scripts just to wait the external resources being available during the integration tests
- after finished I realized I could implement the husky library to force the linter and the formatter to be applied before commits

## Quality

This repo implements jest and supertest libraries in order to keep a nice QA and coverage. You can test things without them, but keep in mind we
can have future regressions because of lack of tests, so try to keep a more jest aproach during the development.

## Recomendations

- vscode
- node.js v22 (there is a .nvmrc in the project)
- [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) for format and linter.
- vscode settings
```
{
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.biome": "always"
    }
}
```

## How to run the project

- create the .env file, you can use the example provided in the project: `cp .env.example .env`  
- create the external dependencies, you can run the compose file provided in the project: `docker compose up -d`
- install the local dependencies: `npm ci`
- run the migrations using the dev environment: `NODE_ENV=dev npm run migration`  
- run the dev server: `npm run dev`

### How to test the project

- integration tests can be ran using `npm run int`
- unit tests can be ran using: `npm run unit`
- you can run all at once by using: `npm test`