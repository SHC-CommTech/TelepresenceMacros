/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Jan-16
Build Version: 2.0.0
**********************************************************/

const xapi = require('xapi');
const KEYBOARD_TYPES = {
      NUMERIC     :   'Numeric'
    , SINGLELINE  :   'SingleLine'
    , PASSWORD    :   'Password'
    , PIN         :   'PIN'
};
const CALL_TYPES = {
      AUDIO     :   'Audio'
    , VIDEO     :   'Video'
};

const DIALPAD_ID = 'webexdialpad';
const DIALHOSTPIN_ID = 'webexhostpin';
const INROOMCONTROL_WEBEXCONTROL_PANELID = 'webexdialler';

/* Use these to check that its a valid number (depending on what you want to allow users to call */
const REGEXP_URLDIALER = /([a-zA-Z0-9@_\-\.]+)/; /*  . Use this one if you want to allow URL dialling */
const REGEXP_NUMERICDIALER =  /^([0-9]{3,10})$/; /* Use this one if you want to limit calls to numeric only. In this example, require number to be between 3 and 10 digits. */
const DIALPREFIX_AUDIO_GATEWAY = '9';

var DIALPOSTFIX_WEBEXURL = '';
var webexnumbertodial = '';
var hostpin = '';
var isInWebexCall = 0;
var dialType = '';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

xapi.event.on('CallDisconnect', (event) => {  //clear all entries on call disconnect
	isInWebexCall = 0;
	DIALPOSTFIX_WEBEXURL = '';
	hostpin = '';
	webexnumbertodial = '';
});
    
function showDialPad(text, Placeholder,finText , type){

  xapi.command("UserInterface Message TextInput Display", {
    InputType: type,
    Placeholder: Placeholder,
    Title: "Webex Call",
    Text: text,
    SubmitText: finText,
    FeedbackId: DIALPAD_ID,
  }).catch((error) => { console.error(error); });
}

function pressEvent(event) {
	if(event.WidgetId === 'callWebex' && event.Type === 'clicked'){
		xapi.command("UserInterface Message Prompt Display", {
			Title: "Select the meeting host organization", 
			FeedbackId: 'hostOrganization', 
			Text: 'Please Select',
			      'Option.1':'Stanford Health Care', 
					  'Option.2':'Stanford University', 
					  'Option.3':'Stanford Children\'s Hospital',
					  'Option.4':'Other',
		});
	}
}

/* This is the listener for the in-room control panel button that will trigger the dial panel to appear */
xapi.event.on('UserInterface Extensions Widget Action', pressEvent);

xapi.event.on('UserInterface Message Prompt	Response', (event) => {

    if(event.FeedbackId === 'hostOrganization') {
      sleep(200).then(() => { //this is a necessary trick to get it working with multiple touch panels to not mess up event-clears from other panels
      console.log(event.OptionId);
      switch(event.OptionId){
          case '1':
            dialType = REGEXP_NUMERICDIALER;
            DIALPOSTFIX_WEBEXURL = '@stanfordmed.webex.com'; //Stanford Health Webex Meeting
            showDialPad(
              "Enter the Webex 9-digit Meeting ID:", 
              " ",
              "Next",
              KEYBOARD_TYPES.NUMERIC
            );
            break;
          case '2':
            dialType = REGEXP_NUMERICDIALER;
            DIALPOSTFIX_WEBEXURL = '@stanford.webex.com'; //Stanford University Webex Meeting
            showDialPad(
              "Enter the Webex 9-digit Meeting ID:", 
              " ",
              "Next",
              KEYBOARD_TYPES.NUMERIC
            );
            break;
          case '3':
            dialType = REGEXP_NUMERICDIALER;
            DIALPOSTFIX_WEBEXURL = '@stanfordchildrens.webex.com'; //LPCH Webex Meeting
            showDialPad(
              "Enter the Webex 9-digit Meeting ID:", 
              " ",
              "Next",
              KEYBOARD_TYPES.NUMERIC
            );
            break;
          default:
          dialType = REGEXP_URLDIALER;
            DIALPOSTFIX_WEBEXURL = ''; //Other option
            showDialPad(
              "Enter the Full Webex Video Address:", 
              "EX: MeetingID@xxxxxxx.webex.com",
              "Join",
              KEYBOARD_TYPES.SINGLELINE
          );
        }
      });
    }
});

xapi.event.on('UserInterface Message TextInput Response', (event) => {
    switch(event.FeedbackId){
        case DIALPAD_ID:
          let match = dialType.exec(event.Text); // First check, is it a valid number to dial
          if(match !== null) { 
            let contains_at_regex = /@/;    
            let contains_at_in_dialstring = contains_at_regex.exec(event.Text);
            if (contains_at_in_dialstring !== null) {
              webexnumbertodial = match[1];
            }
            else{
              webexnumbertodial = match[1];
              webexnumbertodial = webexnumbertodial + DIALPOSTFIX_WEBEXURL ; // Here we add the default hostname to the SIP number 
            }
            sleep(200).then(() => {
              xapi.command("UserInterface Message TextInput Display", {
                InputType: KEYBOARD_TYPES.PIN
                , Placeholder: "Hostpin (optional)" 
                , Title: "Enter Host pin or leave blank"
                , Text: 'Webex call number: ' + webexnumbertodial
                , SubmitText: "Join" 
                , FeedbackId: DIALHOSTPIN_ID
              }).catch((error) => { console.error(error); });                
            });
          }
          else{
            sleep(200).then(() => {
              xapi.command("UserInterface Message Alert Display", {
                Title: "Webex Call",
                Text: "Your entry was invalid. Please try again",
              }).catch((error) => { console.error(error); });
            });
          }
          break;

        case DIALHOSTPIN_ID:
          if(isNaN(event.Text)){
            sleep(200).then(() => {
              xapi.command("UserInterface Message Alert Display", {
                Title: "Webex Call",
                Text: "Your Hostpin was invalid.",
              }).catch((error) => { console.error(error); });
            });
          }
          hostpin = event.Text;
          xapi.command("dial", {Number: webexnumbertodial}).catch((error) => { console.error(error); });
          
          break;
    }
});

xapi.status.on('Call RemoteNumber', (remoteNumber) => {
  if(remoteNumber === webexnumbertodial){
	  isInWebexCall = 1;
	  sleep(5000).then(() => {
		  if(isInWebexCall){ // need to check again in case call has dropped within the last 5 seconds
        if(hostpin.length>0){
          xapi.command("Call DTMFSend", {DTMFString: hostpin});  
            if(!hostpin.includes('#')){
              xapi.command("Call DTMFSend", {DTMFString: '#'});
            }
            DIALPOSTFIX_WEBEXURL = '';
          }
        else{
          xapi.command("Call DTMFSend", {DTMFString: '#'});
        }
		  }		    
		});
	}
});

xapi.status.on('Call Status', (status)  => {
  if(status.includes('Idle')){
    webexnumbertodial = '';
  }
});