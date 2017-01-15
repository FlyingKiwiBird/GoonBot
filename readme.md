# GoonBot

GoonBot is a Node.js application which forwards Jabber messages from the Goonswarm's directorbot (pings) to a Slack.

## Setup

### Part 1: Setup Slack
1. [Create a slack here](https://slack.com/create#email)
2. Create a slack bot
3. Record the slack bot's API Token
4. In your slack add a few channels:
* One to post every message that comes through directorbot
* One for GoonBot to post in if an error occurs/it goes offline
5. Invite the slack bot to all channels that you just created.

### Part 2: Setup GoonBot
1. Install [node.js](https://nodejs.org/en/)
2. Download this project to a folder
3. In that folder run ```npm install```
4. Rename config/default.json.example to config/default.json
5. In the "jabber" section fill in "user" and "password" with your login info from [ESA](https://goonfleet.com/esa/)
6. In the "slack" section fill in "token" with the API token you copied in Part 1 Step 3.
7. In the "slack.channels" section fill in "all" with the name of the channel you want all pings to go to.
8. Again in the "slack.channels" section fill in "status" with the name of the channel you want the bot's status messages to go to.
9. Run the app with npm start.

### Part 3: Optional Setup

#### Run as a service

You probably want this to run as a service so I recommend using [Forever](https://www.npmjs.com/package/forever)

1. Run ```[sudo] npm install forever -g```
2. In the application folder run ```forever start forever.json```

#### Create Filtered Channels

You may want to have a channel specifically for fleet pings, filtered channels provide that option.

1. Create a slack channel
2. Invite the slack bot to that channel.
3. Create a entry in the default.json "slack.channels.filters" section, a couple examples are provided.
4. The "channel" is the name of the channel in slack, "filter" is a regular expression to check against the ping broadcasted.
