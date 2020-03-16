/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Jan-16
Build Version: 4.0.0
**********************************************************/


const xapi = require('xapi');

var result = {
  connectedCalls : 0,
  disconnectedCalls : 0,
  connectedOption1 : 0,
  connectedOption2 : 0,
  connectedOption3 : 0,
  disconnectedOption1 : 0,
  disconnectedOption2 : 0,
  disconnectedOption3 : 0,
  counter : function (){
    console.info('Connected Calls: ' + result.connectedCalls + ' Disconnected Calls: ' + result.disconnectedCalls);
    console.info('Good Calls: ' + result.connectedOption1 + ' Okay Calls: ' + result.connectedOption2 + ' Bad Calls: ' + result.connectedOption3);
    console.info('Wrong Number: ' + result.disconnectedOption1 + " Do Not Know: " + result.disconnectedOption2 + ' Human Error: ' + result.disconnectedOption3);
  }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

xapi.event.on('CallDisconnect', (event) => {
    if(event.Duration > 1){
        xapi.command("UserInterface Message Prompt Display", {
          Title: "How was the meeting experience?", 
          FeedbackId: 'call-quality', 
          Text: 'Please Rate',
                'Option.1':'Wow, that was great!', 
                'Option.2':'It was OK', 
                'Option.3': 'Not impressed.',
          Duration: 15,
        });
      result.connectedCalls = result.connectedCalls + 1;
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
      result.disconnectedCalls = result.disconnectedCalls + 1;
    }
});

xapi.event.on('UserInterface Message Prompt Response', (event) => {
   
    var displaytitle = '';
    var displaytext = '';
    
    if (event.FeedbackId == 'call-quality'){
  
      switch(event.OptionId){
          case '1':
              displaytitle = ':-)';
              displaytext = 'Thank you, yet another satisfied customer!!!';
              result.connectedOption1 = result.connectedOption1 + 1;
              result.counter();
              break;
          case '2':
              displaytitle = ':-|';
              displaytext = 'Ok, will try even harder the next time';
              result.connectedOption2 = result.connectedOption2 + 1;
              result.counter();
              break;
          case '3':
              displaytitle = ':-(';
              displaytext = 'We\'re sorry. We will do better next time.';
              result.connectedOption3 = result.connectedOption3 + 1;
              result.counter();
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
      
      switch(event.OptionId){
          case '1':
              result.disconnectedOption1 = result.disconnectedOption1 + 1;
              result.counter();
              break;
          case '2':
              result.disconnectedOption2 = result.disconnectedOption2 + 1;
              result.counter();
              break;
          case '3':
              result.disconnectedOption3 = result.disconnectedOption3 + 1;
              result.counter();
              break;
      }
    }
});