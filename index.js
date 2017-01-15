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
var emojis = config.get("slack.emojis");



if(config.has("test"))
{
  var testMsg = config.get("test");
  onChat("directorbot@goonfleet.com", testMsg)
}

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


xmpp.on('chat', function(from, message)
{

  onChat(from, message);

});

function onChat(from, message)
{
  console.log(from + ": " + message);

  if(from == "directorbot@goonfleet.com")
  {
    sendToSlack(message, all);
    filterMsg(message);
  }
  else if (from == user) //For testing
  {
    sendToSlack(message, status);
  }
}

function filterMsg(message)
{
  for(var i = 0; i < filters.length; i++)
  {
    var f = filters[i];
    var re = new RegExp(f.filter);

    if(message.match(re))
    {
      sendToSlack(message, f.channel)
    }
  }
}

function emoji(message)
{
  var msg = message;
  for(var i = 0; i < emojis.length; i++)
  {
    var e = emojis[i];
    var re = new RegExp(e.from, "g");
    msg = msg.replace(re, e.to);
  }
  return msg;
}

function sendToSlack(message, channel)
{
  var url = "https://slack.com/api/chat.postMessage";
  var msg = emoji(message);
  var args = {
    token: token,
    channel: channel,
    text: msg,
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
xmpp.subscribe(user);
xmpp.on('subscribe', function(from) {
  console.log("Subscription request:" + from);
if (from === user) {
    xmpp.acceptSubscription(from);
    }
});

//Check status

/**************** App Close ***************/

var closing = false;
var onClose = function()
{
  if(!closing)
  {
    sendToSlack("Offline", status);
  }
  closing = true;
  xmpp.disconnect();



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
