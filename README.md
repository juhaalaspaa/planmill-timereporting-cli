# planmill-timereporting-cli
Node CLI application for making time reports to planmill. A hackathon project with focus on creating value and effective UI to user (myself) rather than on code quality.

## installation
Clone repo and run ```npm install -g .``` on project root

## configuration

### planmill
**baseUrl** (string) - Base url for your planmill api (e.g. https://online.planmill.com/{yourcompany}/api/1.5/)
 
**accessTokenUri** (string) - Url to fetch access token (e.g. https://online.planmill.com/{yourcompany}/api/oauth2/token)

**clientId** (string) - ClientId that you generated on planmill (My Page > Api Registrations), format might be like PlanMill.xxxx.-#########.xxxx

**clientSecret** (string) - ClientSecret that you generated on planmill (My Page > Api Registrations)

**userId** (string) - Your planmill user identifier (Found on My Page > User settings > Internal ID)

**presetTaskIds** (int array) - Predefine preset task ids for faster logging

**additionalProjectIdsToFetch** (int array) - Planmill returns projects on a certain view template for api client user, but sometimes some  projects are not returend, here you can define additional projects to be fetched so that time reporting is available for all required projects and tasks  

**projectIdsNotToFetch** (int array) - Some projects can be filtered out here (e.g. projects that have ended or you no longer work on it)

### filePaths
**token** (string) - Full path where to store access token

**tasks** (string) - Full path to tasks json file

**projects** (string) - Full path to projects json file

**timeReportsFolder** (string) - Path to time reports folder where to store single day time reports json

### general

**workStartHour24clock** (number) - Default start time of work day (e.g. 8), used for calculating passed time when automatically calculating time report hours

**defaultLunchBreakLengthInHours** (number) - Default lenght of lunch break logged with lb command (e.g. 0.5)

## usage

### First time usage
```pm fetch``` - Fetches task from planmill and stores them locally, can be used again and again to update available tasks

### Log time report

To log time report you will be prompted for **task**, **hours** and **time report description**. Prompts vary on the log method you use. Also some default values are calculated for you and those will be used by pressing giving empty answer/pressing enter on prompt.

```pm l``` Log time report. Task, hours and description will be prompted.

```pm p <preset>``` Log time report to a preset task defined on config (1 = first item on presetTaskIds array)

```pm m``` Log time report to most used task. Most used tasks within a month or so are returend on lsit prompt.

### Log break

```pm b``` Logs break on time report, hours will be prompted (calculated default value is available)

```pm lb``` Log lunch break with lenght defined on config

### Delete time report or break

```pm d``` Deletes most recent time report entry (locally)

```pm d <i>``` Deletes time report entry at position *i* (locally)

### List time reports

```pm t``` List time report entries for current day (local)

```pm y``` List time report entries for yesterday (or most recent day found) from planmill

### Upload time reports to Planmill

```pm push``` Uploads current day time reports to planmill via API (do only once as multiple commands uploads new time report entries). If no reports for today are stored, upload most recent entries (within 5 days). This way you can easily upload time reports that you forgot to upload at the end of the day before logging any entries for today

### Additional functionality

```pm lp``` List preset tasks defined in config

```pm --help``` List all commands
