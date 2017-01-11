var xmpp = require('simple-xmpp');
var config = require('config');
var request = require('request');

var user = config.get('jabber.user');
var pass = config.get('jabber.password');
var host = "conference.goonfleet.com";
var port = 5222;

var token = config.get("slack.token");

var all = config.get("slack.channels.all");
var filters = config.get("slack.channels.filters");
var status = config.get("slack.channels.status");

console.log("Connecting to " + host + ":" + port);



xmpp.on('error', function(err) {
    sendToSlack("Error: " + err, status);
        console.error(err);
});

xmpp.on('online', function(data) {
    console.log('Connected: ' + data.jid.user);
    sendToSlack("Online", status);
});

xmpp.on('close', function() {
    console.warn('Disconnected');
    sendToSlack("Offline", status);
    //Attempt reconnect
    connect();
});


xmpp.on('chat', function(from, message) {

    if(from == "directorbot@goonfleet.com")
    {
      sendToSlack(message, all);
      filterMsg(message);

    }
    console.log(from + ": " + message);
});

function filterMsg(message)
{
  for(var i = 0; i < filters.length; i++)
  {
    var f = filters[i];
    var re = f.filter;
    if(message.match(re))
    {
      sendToSlack(message, f.channel)
    }
  }
}

function sendToSlack(message, channel)
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



function connect()
{
  xmpp.connect({
              jid: user,
              password: pass,
              host: host,
              port: port
  });
}

connect();

//Check status

/**************** App Close ***************/

var closing = false;
var onClose = function()
{
  xmpp.disconnect();

  sendToSlack("Offline", status);

  setTimeout(function()
  {
      process.exit(0);
  }, 500);

};

process.on ('exit', onClose);
process.on ('stop', onClose);
process.on('SIGHUP', onClose);
process.on('SIGQUIT', onClose);
process.on('SIGINT', onClose);
process.on('SIGTERM', onClose);
process.on('uncaughtException', onClose);
