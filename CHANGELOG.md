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
