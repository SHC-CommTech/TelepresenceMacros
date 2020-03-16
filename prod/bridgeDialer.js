/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Jan-16
Build Version: 1.0.0
**********************************************************/

const xapi = require('xapi');

function callEvent(event) {
  
  if (event.WidgetId === 'callZoom' && event.Type === 'released') {
    xapi.command('Dial', { Number: 'meet@zoomcrc.com' })
    //showDialPad("Please enter the meeting Number:" );
  }  
  if (event.WidgetId === 'callAcano' && event.Type === 'released') {
    xapi.command('Dial', { Number: '6507364444@stanfordhealthcare.org' })
    //showDialPad("Please enter the meeting Number:" );
  }

}

xapi.event.on('UserInterface Extensions Widget Action', callEvent);