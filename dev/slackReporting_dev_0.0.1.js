/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Feb-06
Build Version: 0.0.1
**********************************************************/

const xapi = require('xapi');
const SLACK_INSTANCE_URL = 'https://hooks.slack.com/services/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'; // Specify a URL to a service like Slack etc.
const CONTENT_TYPE = "Content-Type: application/json";
const USER_ACCESS_TOKEN = 'xoxb-6856275383-943224072486-XMcMEffEgV0A4ADIjl5zfiWF'; // Bot User OAuth Access Token
const AUTH_HEADER = "Authorization: Bearer " + USER_ACCESS_TOKEN;

var systemInfo = {
    softwareVersion : ''
    , systemName : ''
    , softwareReleaseDate : ''
};


function postMessage(message){
  xapi.command('HttpClient Post', {'Header': [AUTH_HEADER, CONTENT_TYPE]  , 'Url':SLACK_INSTANCE_URL, 'AllowInsecureHTTPS': 'False'}, JSON.stringify(message)).then((response) => {
    var headers = response.Headers
    console.log(JSON.stringify(headers));
    var status = JSON.parse(headers).status;
    console.log(status);
    if(status == "OK"){
      xapi.command('message prompt display',{
        Title: "Messege",
        Text: "Your Assistance Alert Message Has been sent to the proper support team.",
      }).catch((error) => { console.error(error); });
    }
  });
}

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


xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
  if(event.PanelId == "slackMessager"){
    var message = {
      "channel":"500p-badass-av-crew",
      "text": "Hello, World! This message comes to you from " + systemInfo.systemName,
    };
    postMessage(message)
  }
});

