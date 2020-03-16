/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Jan-16
Build Version: 4.1.2
**********************************************************/


const xapi = require('xapi');
const DBSERVERURL = "http://shfusntemap101.enterprise.stanfordmed.org:3000/posts"; //URL for JSON Database Server
const CONTENT_TYPE = "Content-Type: application/json";

var dialedString = "";
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var systemInfo = {
    softwareVersion : ''
    , systemName : ''
    , softwareReleaseDate : ''
};

var systemTime = {
  calendar : function (){
    var d = new Date();
    var calendar = d.getFullYear() + '-' + months[d.getMonth()] + '-'+ d.getDate();
    return calendar.toString();
  },
  timestamp : function (){
    var d = new Date();
    let fullhours = ((d.getHours() < 10) ? '0' : '') + d.getHours();
    let fullmins = ((d.getMinutes() < 10) ? '0' : '') + d.getMinutes();
    let fullsecs = ((d.getSeconds() < 10) ? '0' : '') + d.getSeconds();
    var timestamp = fullhours + ':' + fullmins + ':' +fullsecs;
    return timestamp.toString();
  }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function postResult(message) {
  return xapi.command('HttpClient Post', { 'Header': CONTENT_TYPE, 'Url': DBSERVERURL, 'AllowInsecureHTTPS': 'False'}, JSON.stringify(message)).catch((error) => { console.error(error);});
}
function buildEntry(CallType, Result){
  
  var message = {
    "Date": systemTime.calendar(),
    "Time": systemTime.timestamp(),
    "systemName":systemInfo.systemName,
    "surveyType": CallType,
    "CallNumber": dialedString,
    "result": Result
  };
  
  console.log(message);
  var response = postResult(message);
  console.log(JSON.stringify(response));

}

xapi.event.on('CallDisconnect', (event) => {
    dialedString = event.RemoteURI;
    if(event.Duration > 1){
        xapi.command("UserInterface Message Prompt Display", {
          Title: "How was the meeting experience?", 
          FeedbackId: 'call-quality', 
          Text: 'Please Rate',
                'Option.1':'Wow, that was great!', 
                'Option.2':'It was OK', 
                'Option.3':'Not impressed.',
          Duration: 15,
        });
    }
    
    else{
        xapi.command("UserInterface Message Prompt Display", {
          Title: "What went wrong?", 
          Text: 'Hm, no call. What happened?', 
                'Option.1':'I dialed the wrong number!', 
                'Option.2':"I don't know" , 
                'Option.3': 'Oops, wrong button',
          Duration: 15,
        });
    }
});

xapi.event.on('UserInterface Message Prompt Response', (event) => {
   
    var displaytitle = '';
    var displaytext = '';
    
    if (event.FeedbackId == 'call-quality'){
      
      buildEntry('Complete Call', event.OptionId);
  
      switch(event.OptionId){
          case '1':
              displaytitle = ':-)';
              displaytext = 'Thank you, yet another satisfied customer!!!';
              break;
          case '2':
              displaytitle = ':-|';
              displaytext = 'Ok, will try even harder the next time';
              break;
          case '3':
              displaytitle = ':-(';
              displaytext = 'We\'re sorry. We will do better next time.';
              break;
  
          default:
              displaytext = 'Hm, that was an unhandled answer';
      }
      
      sleep(70);
      
      xapi.command("UserInterface Message Alert Display", {
          Title: displaytitle,
          Text: displaytext,
          Duration: 5,
      });
      }
    else{
      
      buildEntry('Incomplete Call', event.OptionId);
      
      }

});

function init(){
  xapi.status.get('SystemUnit Software Version').then((value) => {
    systemInfo.softwareVersion = value;
  });
  xapi.config.get('SystemUnit Name').then((value) => {
    if(value === ''){
      xapi.status.get('SystemUnit Hardware Module SerialNumber').then((value) => {
        systemInfo.systemName = value;
      });
    }
    else{
      systemInfo.systemName = value;
    }
  });
  xapi.status.get('SystemUnit Software ReleaseDate').then((value) => {
    systemInfo.softwareReleaseDate = value;
  });
  xapi.config.set('HttpClient Mode', 'On');
}

init();