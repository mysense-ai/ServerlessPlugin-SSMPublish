## [1.4.1](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.4.0...v1.4.1) (2020-10-14)


### Bug Fixes

* update packages for vulnerabilities ([6b370e7](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/6b370e7ca1124060668042d4ea324e913a99b7da))

# [1.4.0](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.3.0...v1.4.0) (2020-10-14)


### Bug Fixes

* remove package lock ([a551fbc](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/a551fbc4ad6aa738125e52cf81b8dfdcda7dbbd3))
* revert tags ([ed112f6](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/ed112f6bf9e35b9b2e0bbb637874c192e210d87a))
* store string list as comma separated array ([dad012d](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/dad012d77ee13a7e3368541f6e5dae55843c571a))


### Features

* add support for string list and tags ([9674a5d](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/9674a5d275ebd24166b6e95cbbfa9b2758087a94))

# [1.3.0](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.2.2...v1.3.0) (2020-07-22)


### Bug Fixes

* log statement ([c2e7a71](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/c2e7a71421283ab5234480eae347139668c1114e))


### Features

* add enabled/disabled control on each param ([61b30f7](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/61b30f76f09e86e33d44526a2d9152bf87f8bcb4))

## [1.2.2](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.2.1...v1.2.2) (2020-04-21)


### Bug Fixes

* update packages for vulns ([95254cc](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/95254cc8ab182a250babd4d78d4f2808ecb1b86a))

## [1.2.1](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.2.0...v1.2.1) (2020-04-03)


### Bug Fixes

* improve messaging when no SSM updates are performed ([0bb5a6b](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/0bb5a6bfa52b064c4bcf75fe5be4ae78c736bef9))
* remove spacing that causes table to be misaligned ([764cfbf](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/764cfbfddf0f3821a0dbb1e1a2f62a7c5b8ad24f))

# [1.2.0](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.1.5...v1.2.0) (2020-04-03)


### Bug Fixes

* failing unit test due to typing issue ([73318e2](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/73318e279356686d1ef2e57cfc2cefaf4fcf9c24))


### Features

* add npm packages ([278b6b3](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/278b6b35feabdb16d8a5ab0ebd22401db1c34809))
* display SSM Put & SSM Publish results in markdown table ([2a2b48e](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/2a2b48e12aa372edadfd46265417c39a3b0ab221))

## [1.1.5](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.1.4...v1.1.5) (2020-04-02)


### Bug Fixes

* serialized YAML does not match original YAML definition ([5c43a75](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/5c43a75cbda8d5a99e9e34eb8300ce9abdde2d41))

## [1.1.4](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.1.3...v1.1.4) (2020-04-02)


### Bug Fixes

* allow param `value` to be `string | object` ([629eaaa](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/629eaaa9f20273aaa6d370d00ed8e39b329ea73e))

## [1.1.3](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.1.2...v1.1.3) (2020-04-01)


### Bug Fixes

* downgrade minimum Node version to 10 ([7324bea](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/7324bea1380f5eda7d1c7fffed6ecfccedf10bdb))

## [1.1.2](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.1.1...v1.1.2) (2020-04-01)


### Bug Fixes

* ensure cloud formation description is respected if existing ([13064d0](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/13064d0d108839423e42740097451262ea85b5cd))

## [1.1.1](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.1.0...v1.1.1) (2020-04-01)


### Bug Fixes

* account for SSM.GetParameters only taking max 10 names as input ([e3dea89](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/e3dea896abf4fcfd0e2f47e22304749e03057958))

# [1.1.0](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.0.2...v1.1.0) (2020-03-31)

### Features

* add option to publish Cloud Formation Output to SSM ([d1283bd](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/d1283bd8a0d2ad199fb9a7023740abe97a6e727f))
* improve granularity of control over CF output publishing ([437f02f](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/437f02f2ec44f68da08c56ef24d5394540c50ced))

## [1.0.2](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/compare/v1.0.1...v1.0.2) (2020-03-30)


### Bug Fixes

* fix typo in semantic-release settings to publish changelog ([bcc191a](https://github.com/mysense-ai/ServerlessPlugin-SSMPublish/commit/bcc191a6267ae15cc07b3a500ee83c233d347b11))

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

* **Extended CLI usage** - Allowing you to publish specific params to SSM using the cli

## [1.0.0] - 2020-03-27
### Added
* **SSM parameter publishing** - This releases the first version of serverless-ssm-publish, allowing you to publish parameters to SSM from your serverless.yaml.

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.0.1] - 2019-08-13
### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security
