/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Feb-06
Build Version: 0.0.0
**********************************************************/

const xapi = require('xapi');
const CONTENT_TYPE = "Content-Type: application/json";
const USER_ACCESS_TOKEN = 'xoxb-6856275383-943224072486-XMcMEffEgV0A4ADIjl5zfiWF';
const AUTH_HEADER = USER_ACCESS_TOKEN;

var systemInfo = {
    softwareVersion : ''
    , systemName : ''
    , softwareReleaseDate : ''
};

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