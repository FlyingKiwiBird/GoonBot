var xmpp = require('simple-xmpp');
var config = require('config');
var request = require('request');

var user = config.get('jabber.user');
var pass = config.get('jabber.password');
var host = "conference.goonfleet.com";
var port = 5222;

var bot = config.get("slack.bot");
var channel = config.get("slack.channel");
var token = config.get("slack.token");

console.log("Connecting to " + host + ":" + port);



xmpp.on('error', function(err) {
        console.error(err);
});

xmpp.on('online', function(data) {
    console.log('Connected: ' + data.jid.user);
    sendToSlack("Online");
});

xmpp.on('chat', function(from, message) {

    if(from == "directorbot@goonfleet.com")
    {
      sendToSlack(message);
      console.log("PING!");
    }
    console.log(from + ": " + message);
});

function sendToSlack(message)
{
  var url = "https://slack.com/api/chat.postMessage";
  var args = {
    token: token,
    channel: channel,
    text: message,
    as_user: true
  };

  request.post({
    url: url,
    json: true,
    form: args
  },
  function (error, response, body) {
    if (error || !body.ok) {
        console.log('Error:', error || body.error);
    }
  });

}

xmpp.connect({
            jid: user,
            password: pass,
            host: host,
            port: port
});
