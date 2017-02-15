var db = require("./database")();

function CustomBot(bot, ta_id, admin_id, bot_flavor){
  this.bot = bot;
  this.bot_flavor = bot_flavor;
  this.getSecret();

  this.ta_id = ta_id.split(",");
  this.admin_id = admin_id.split(",");

  return this;
}

CustomBot.prototype.greet = function(){
  console.log(this.bot_flavor.greeting);
};

CustomBot.prototype.parse_message_text = function(){
  var text = this.message.text || "";
  text = text.split(/<.*>:?\s*/)[1] || "";

  return (text === "") ? this.message.text : text.trim();
};

CustomBot.prototype.help = function(){
  this.bot.sendMessage(
    this.message.channel,
    "Hello, I am C3P0, protocol droid, human-cyborg relations. I am fluent in over 6 million forms of communication, including JavaScript, Ruby and SQL. "+
    "All commands work only when you specifically mention me, or send me a private message. " +
    "To join the queue, you must have a particular question attached to the command. Type `queue me Javascript is hard` or `q me i don't understand functions` to queue yourself. This way, Master Daniel can help in the best way possible. " +
    "Use `status` to check the current queue. " +
    "Type `remove me` to remove yourself."
  );
};

CustomBot.prototype.getSecret = function(){
  db.get("SELECT * FROM secret", function(err, row){
    if(row) this.secret = row.value;
    console.log("The current attendance secret is: " + this.secret);
  }.bind(this));
};

CustomBot.prototype.setSecret = function(text){
  var capture = /set secret\s*(\S*).*/.exec(text);
  var secret = capture[1];

  if(secret === "" || secret === undefined || secret === null){
    secret = Math.random().toString(36).substring(7);
  }

  var stmt = db.prepare("UPDATE secret SET value = (?)");
  stmt.run(secret);

  this.secret = secret;
  console.log(this.bot_flavor.secret_set || "Secret word has been updated");
};

CustomBot.prototype.randomQuote = function(){
  var quotes = this.bot_flavor.quotes || ["Hello!", ":D"];
  var quote = quotes[Math.floor(Math.random()*quotes.length)];

  return quote.replace(/<user>/g, this.full_name);
};

CustomBot.prototype.getAccessLevel = function(){
  var access_level = 0;

  if(this.admin_id.indexOf(this.user) != -1){
    access_level = 3;

  } else if(this.ta_id.indexOf(this.user) != -1){
    access_level = 2;
  }

  return access_level;
};

CustomBot.prototype.respond = function(message){
  this.message = message;
  this.channel = message.channel;
  this.user = message.user;
  this.full_name = `<@${this.user}>`;
  this.access_level = this.getAccessLevel();

  var text = this.parse_message_text(),
      tmp_result;

  switch(text){
    case "hello":
      this.bot.sendMessage(this.channel, `Greetings ${this.full_name}! It is I, C-3PO! You probably do not recognize me because of the red arm`);
      break;
    case "commands":
      this.bot.sendMessage(this.channel, 'Oh my, yes, these are a list of my commands  `queue me` `q me` `remove me` `remove` `threepio` `i\'m confused` `obey` `dark side` `R2D2` `is it a trap`');
      break;
    case "i'm confused":
      this.bot.sendMessage(this.channel, 'Although I am programed in over 6 million forms of communication, Google might be a bit more advanced','https://m.popkey.co/5aefe6/9wdDD_s-200x150.gif');
      break;
    case 'is it a trap':
      this.bot.sendMessage(this.channel, 'https://www.youtube.com/watch?v=4F4qzPbcFiA');
      break;
    case "Artoo":
    case "R2D2":
    case "r2":
      this.bot.sendMessage(this.channel, 'https://www.youtube.com/watch?v=B6mh45mA_JY');
      break;
    case "obey":
      this.bot.sendMessage(this.channel, 'I only obey Master Daniel');
      break;
    case "threepio":
      this.bot.sendMessage(this.channel, this.bot_flavor.quotes[Math.floor(Math.random()*this.bot_flavor.quotes.length)]);
      break;
    case "queue me":
    case 'q me':
    case 'que me':
      this.bot.sendMessage(this.channel, "If you're going to queue, it's best to come with a question");
      break;
    case "dark side":
      this.bot.sendMessage(this.channel, 'http://41.media.tumblr.com/e3a3451fa0ca9c0740ccefbbe792cdcb/tumblr_o151s0BmQk1r46py4o1_500.jpg');
    case "queue":
    case "status":
      this.bot.sendMessage(this.channel, this.print_queue());
      break;
    case "what is my user id?":
      this.bot.sendMessage(this.channel, "Your id is: " + this.user);
      break;
    case (tmp_result = /^(q|queue)\sme(.*)/.exec(text) || {}).input:
      this.add_to_queue(tmp_result[2]);
      break;
    case "remove":
    case "remove me":
      this.remove();
      break;
    case (tmp_result = /^remove\s+([a-zA-Z0-9, ]*)/.exec(text) || {}).input:
      if(this.access_level >= 2) this.remove(tmp_result[1]);
      break;
    case "help":
      this.help();
      break;
    case this.secret:
      this.checkAttendance();
      break;
    case "clear queue":
      if(this.access_level >= 2) this.clearQueue();
      break;
    case "next":
      if(this.access_level >= 2) this.next();
      break;
    case "attendance":
      if(this.access_level >= 2) this.printAttendance();
      break;
    case "clear attendance":
      if(this.access_level >= 2) this.clearAttendance();
      break;
    case (tmp_result = /^set secret\s*.*/.exec(text) || {}).input:
      if(this.access_level >= 3) this.setSecret(text);
    default:
  }
};

exports.CustomBot = CustomBot;
