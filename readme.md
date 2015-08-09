# da-rabbitmq-rx

[![Build Status](https://travis-ci.org/data-avail/da-rabbitmq-rx.svg?branch=master)](https://travis-ci.org/data-avail/da-rabbitmq-rx)

Project description.

Contains typeScript defintion files. 

[Documentation](https://data-avail.github.io/da-rabbitmq-rx)

### Description

Allow to connect, subscribe and publish rabbitmq messages in reactive style.

#### For subscriptions, use `RabbitSub` class

+ First to create subscription stream invoke `connect` method.
+ Next subscribe to `stream` field. First `onNext` is always 
notification about sucessfull connection, skip it if not intersted.

#### For publishing, use `RabbitPub` class
+ First to create publisher invoke `connect` method.
+ You can subscribe to `connectStream` field in order to know when
connection estabilished.
+ You could write data without waiting connection to complete.
Data will be send when connection estabilished.

## Test

Set up uri for RABBITMQ 

+ In `.npmrc` set `RABBIT_URI=xxx`, higest priority
+ In `package.json` field `config.RABBIT_URI`

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

To publish docs  on `github`
```
git checkout --orphan gh-pages
git add --all .
git commit -am "first commit"
git push origin gh-pages
``` 