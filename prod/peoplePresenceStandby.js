/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Jan-16
Build Version: 1.0.0
**********************************************************/


const xapi = require('xapi');

var TIMEOUT;
var standbyTimer;

function codecSleep(){
  xapi.command('Standby Activate');
  console.log('Codec Asleep from lack of People Presence');
}

function getTimeout(){
  xapi.config.get('Standby Delay').then((Delay) => {
    console.log(Delay);
    let a = parseInt(Delay)*60000; //x6000 to turn minutes into milliseconds
    TIMEOUT = a;
  });
}

xapi.status.on('RoomAnalytics PeoplePresence', (peopleDetect) => {
  console.log('PeoplePresence: ', peopleDetect);
  if (peopleDetect == 'No'){
    standbyTimer = setTimeout(codecSleep, TIMEOUT);
    console.log('Standby Timeout Started.');
  }
  else if (peopleDetect == 'Yes'){
    if(standbyTimer){
      console.log("Standby Timer Cancelled.");
      clearTimeout(standbyTimer);
    }
    getTimeout();
  }
});


