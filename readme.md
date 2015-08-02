# da-rabbitmq-rx

[![Build Status](https://travis-ci.org/data-avail/da-rabbitmq-rx.svg?branch=master)](https://travis-ci.org/data-avail/da-rabbitmq-rx)

Project description.

Contains typeScript defintion files. 

[Documentation](https://data-avail.github.io/da-rabbitmq-rx)

## Test

Set up uri for test db 

+ In `.npmrc` set `SOME_URI=xxx`, higest priority
+ In `package.json` field `config.SOME_URI`

Run test
 
`npm test`

## Development

Project contians `tasks` file for Visual Studio Code

+ Build - run `tsc`, same as `npm run-task build`
+ Test - run `mocha`, same as `npm test`

For some reason VS Code take quite a time to start build,
usually watch rebuild proccess via `tsc -w` work much faster.

This way use `tsc -w` in console and then run test task manually,
when neccessary.   

## Documentation 

Generate `typedoc ./src/index.ts` 