var xmpp = require('simple-xmpp');
var config = require('config');
var request = require('request');

var moment = require('moment-timezone');
var tz = config.get('timezone');

var user = config.get('jabber.user');
var pass = config.get('jabber.password');
var nick = config.get('jabber.nick');
var host = "conference.goonfleet.com";
var port = 5222;

var connectionAttempts = 0;

var token = config.get("slack.token");

var all = config.get("slack.channels.all");
var filters = config.get("slack.channels.filters");
var status = config.get("slack.channels.status");
var emojis = config.get("slack.emojis");

var jabberRoomToSlack = [];



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
    connectionAttempts = 0;
});

xmpp.on('close', function() {
    console.warn('Disconnected');
    sendToSlack("Offline", status);
    //Attempt reconnect
    reconnect();
});


xmpp.on('chat', function(from, message)
{

  onChat(from, message);

});

xmpp.on('groupchat', function(conference, from, message, stamp)
{
   var re = /([^@]+)@/g;
   var match = re.exec(conference);
   var room = match[1];

   console.log(from + "@" + room + ": " + message);
   console.log(jabberRoomToSlack[room]);
   sendToSlack(from + ": " + message, jabberRoomToSlack[room]);
});


function onChat(from, message)
{
  console.log(from + ": " + message);

  if(from == "directorbot@goonfleet.com")
  {

    var res = filterMsg(message);
    if(!res)
    {
      //Only send to all if it did not already go to a filter
      sendToSlack(message, all);
    }
  }
  else if (from == user) //For testing
  {
    sendToSlack(message, status);
  }
}



function filterMsg(message)
{
  var filtered = false;
  for(var i = 0; i < filters.length; i++)
  {
    var f = filters[i];
    var re = new RegExp(f.filter);

    if(message.match(re))
    {
      filtered = true;
      sendToSlack(message, f.channel)
    }
  }
  return filtered;
}

/* Message Modifications */

function modifyMessage(message)
{
  var m = emoji(message);
  m = eveTime(m);
  return m;
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

function eveTime(message)
{
  var re = /\b(\d{1,2}:\d{2}|\d{4})([\.,:]\d*)*(eve)?\b/gi;

  var rpos = 0;
  var replace = [];
  while(match = re.exec(message))
  {
    //Get posistion
    var i = match['index'];
    i += match[0].length + rpos;

    //Get the time
    var time = match[1];
    var m = moment.utc(time, "HHmm")
    if(!m.isValid())
    {
      m = moment.utc(time, "HH:mm")

      if(!m.isValid())
      {
        console.error("Time format not supported");
        continue;
      }
    }
    var timeStr = "(:alarm_clock:" + m.tz(tz).format("h:mm a") + ") ";
    rpos += timeStr.length;

    var t = {};
    t.pos = i;
    t.str = timeStr;

    replace.push(t);
  }

  for(var i = 0; i < replace.length; i++)
  {
    message = insertText(message, replace[i].str, replace[i].pos);
  }

  return message;

}

function insertText(body, insert, pos)
{
  var s1 = body.slice(0, pos);
  var s2 = body.slice(pos);
  return s1 + insert + s2;
}


/* Export to slack */

function sendToSlack(message, channel)
{
  var url = "https://slack.com/api/chat.postMessage";
  var msg = modifyMessage(message);
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


/* Connections */

function connect()
{
  xmpp.connect({
              jid: user,
              password: pass,
              host: host,
              port: port
  });

  joinRooms();
}

function reconnect()
{
    if(connectionAttempts < 5)
    {
      connect();
      connectionAttempts++;
    }
    else {
      //After 5 attempts slow down reconnects
      setTimeout(function(){
        connectionAttempts = 4;
        reconnect();
      }, 5 * 1000);
    }
}

function joinRooms()
{
  jabberRoomToSlack = [];
  var rooms = config.get("slack.channels.rooms");
  for(var i = 0; i < rooms.length; i++)
  {
    var jabberRoom = rooms[i].room;
    var slackChannel = rooms[i].channel;
    jabberRoomToSlack[jabberRoom] = slackChannel;
    xmpp.join(jabberRoom + "@" + host + "/" + nick);
  }

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
