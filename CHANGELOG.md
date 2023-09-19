
# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased] - yyyy-mm-dd

### Added
- Added changelog

### Fixed
- Combined logging a break to single command with optional hour argument

## [1.0.8] - 2023-09-16
  
### Added
- Validate configuration #1

### Changed
- Implemented use of previous descriptions as base value when logging time report
- Implemented logging a break with hour argument

## [1.0.7] - 2023-09-16
  
### Added
- Use inquirer-autocomplete-prompt for searching tasks #2
- Extended configuration and usage instructions on readme

### Changed
- Rearranged config json

## [1.0.6] - 2023-09-10
  
### Added
- Implemented logging to most used tasks

## [1.0.5] - 2023-09-09
  
### Added
- Implemented list preset tasks functionality

### Changed
- Changed break naming convention
- Delete last time report if no index given on argument
- Generated newer version of package-lock file

## [1.0.4] - 2023-09-04
  
### Added
- Display not yet logged time within todays time report log

### Changed
- Simplified command syntaxes

## [1.0.3] - 2023-09-04
  
### Added
- Implemented completing time report description (if given empty) from previous time report to same task

## [1.0.2] - 2023-09-04
  
### Added
- Implemented commands for logging lunch break and logging to preset tasks
- Implemented configuring projects to skip and projects to fetch additionally
- Implemented logging breaks on time reports
- Implemented getting most recent existing time report contents when pushing

### Changed
- Replace timezone Z with +0000 instead of +0200
- Replace also Bug with # on description
- Combine equal time reports when pushing
- Extract file operations to a dedicated service
- Accept also negative hours on break to manipulate logging start time

### Fixed
- Added Content-Type to post timereport request to fix encoding
- Map taskId correctly to get total hours from yesterdays time reports

## [1.0.0] - 2023-03-26
 
### Added

- Implemented main features
