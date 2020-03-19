/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Jan-16
Build Version: 4.2.0 
**********************************************************/


const xapi = require('xapi');
const DBSERVERURL = "http://shfusntemap101.enterprise.stanfordmed.org:3000/posts"; //URL for JSON Database Server
const CONTENT_TYPE = "Content-Type: application/json";

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
    var timestamp = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
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
    "result": Result,
  };
  
  console.log(message);
  var response = postResult(message);
  console.log(JSON.stringify(response));

}

function promptUserForTicket(){
        xapi.command("UserInterface Message Prompt Display", {
          Title: "How can we make it right?", 
          FeedbackId: 'ticket-option', 
          Text: 'Would you like to open a ticket so we can make your experience better?',
                'Option.1':'Yes, please!', 
                'Option.2':'Not right now.', 
          Duration: 15,
        });
}

xapi.event.on('CallDisconnect', (event) => {
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
              xapi.command("UserInterface Message Alert Display", {
                Title: ':-)',
                Text: 'Thank you, yet another satisfied customer!!!',
                Duration: 5,
              });
              break;
          case '2':
              xapi.command("UserInterface Message Alert Display", {
                Title: ':-|',
                Text: 'Ok, will try even harder the next time',
                Duration: 5,
              });
              break;
          case '3':
              promptUserForTicket();
              break;
          default:
              displaytext = 'Hm, that was an unhandled answer';
      }

    }
    else{
      
      buildEntry('Incomplete Call', event.OptionId);
      
    }
    if(event.FeedbackId == 'ticket-option'){
      if(event.OptionId == "1"){
        xapi.command("UserInterface Message TextInput Display", {
          Duration: 0,
          FeedbackId: "roomfeedback_getSID",
          InputType: "SingleLine",
          KeyboardState: "Open",
          Placeholder: "(If you do not have an SID, leave blank)",
          SubmitText: "Submit",
          Text: "Please Provide Your SID.",
          Title: "ServiceNow Credentials",
        }).catch((error) => { console.error(error); });
      }
      else{
        xapi.command("UserInterface Message Alert Display", {
                Title: ':-(',
                Text: "We're sorry! If you need further assistance, please contact the Service Desk at (650) 723-3333.",
                Duration: 5,
              });
      }
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