/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Feb-05
Build Version: 1.0.0
**********************************************************/

const xapi = require('xapi');
const mersiveSource = 2; //Input number for Mersive - Change as needed

let mersiveUsedInCall = false;
let mersiveUsedOutOfCall = false;

var result = {
  MersiveUses : 0,
  MersiveOption1 : 0,
  MersiveOption2 : 0,
  MersiveOption3 : 0,
  MersiveOption4 : 0,
  counter : function (){
    console.info('Total Mersive Uses: ' + result.MersiveUses);
    console.info('Good: ' + result.MersiveOption1 + ' Okay: ' + result.MersiveOption2 + ' Bad: ' + result.MersiveOption3 + "Did Not Use: " + result.MersiveOption4);
  }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

xapi.event.on('PresentationStarted', (event) => {
  if(event.LocalSource == mersiveSource){
    mersiveUsedInCall = true;
    console.log(mersiveUsedInCall);
  }
});

xapi.event.on('PresentationPreviewStarted', (event) => {
  if(event.LocalSource == mersiveSource){
    mersiveUsedOutOfCall = true;
    console.log(mersiveUsedOutOfCall);
  }
});

xapi.event.on('CallDisconnect', (event) => {
    if(mersiveUsedInCall === true){
        xapi.command("UserInterface Message Prompt Display", {
          Title: "How was your experience with", 
          FeedbackId: 'mersive-Survey', 
          Text: '<bold>Mersive Wireless Presentation</bold>?',
                'Option.1':'Wow, that was great!', 
                'Option.2':'It was OK', 
                'Option.3': 'Not impressed.',
                'Option.4': "I didn't use it.",
          Duration: 30,
        });
      result.MersiveUses = result.MersiveUses + 1;
      mersiveUsedInCall = false;
    }
});
xapi.event.on('PresentationPreviewStopped', (event) => {
  xapi.status.get('Conference ActiveSpeaker CallId').then((CallId) => {
    console.log('CallId: ', CallId);
    if(CallId == '0'){
      if(mersiveUsedOutOfCall === true){
          xapi.command("UserInterface Message Prompt Display", {
            Title: "Please rate your experience with", 
            FeedbackId: 'mersive-Survey', 
            Text: '<bold>Mersive Wireless Presentation</bold>?',
                  'Option.1':'Excellent!', 
                  'Option.2':'It was OK', 
                  'Option.3': 'Not impressed.',
                  'Option.4': "I didn't use it.",
            Duration: 30,
          });
      result.MersiveUses = result.MersiveUses + 1;
      mersiveUsedOutOfCall = false;
      }
    }
  });
});

xapi.event.on('UserInterface Message Prompt Response', (event) => {
   
    var displaytitle = '';
    var displaytext = '';
    
    if (event.FeedbackId == 'mersive-Survey'){
  
      switch(event.OptionId){
          case '1':
              displaytitle = 'Feedback Receipt';
              displaytext = 'Thank you. Your feedback has been received.';
              result.MersiveOption1 = result.MersiveOption1 + 1;
              result.counter();
              break;
          case '2':
              displaytitle = 'Feedback Receipt';
              displaytext = 'Thank you. Your feedback has been received.';
              result.MersiveOption2 = result.MersiveOption2 + 1;
              result.counter();
              break;
          case '3':
              displaytitle = 'Feedback Receipt';
              displaytext = 'Thank you. Your feedback has been received.';
              result.MersiveOption3 = result.MersiveOption3 + 1;
              result.counter();
              break;
          case '4':
              displaytitle = 'Feedback Receipt';
              displaytext = 'Thank you. Your feedback has been received.';
              result.MersiveOption4 = result.MersiveOption4 + 1;
              result.counter();
              break;
  
          default:
              displaytext = 'Hm, that was an unhandled answer';
        }
      
      sleep(70);

    xapi.command("UserInterface Message TextInput Display", {
          Duration: 60
        , FeedbackId: "feedback_step1"
        , InputType: "SingleLine"
        , KeyboardState: "Open"
        , Placeholder: "Write your feedback here"
        , SubmitText: "Next"
        , Text: "Please provide us with some notes to make your experience better next time."
        , Title: "Feedback"
          }).catch((error) => { console.error(error);
    });
    xapi.event.on('UserInterface Message TextInput Response', (event) => {
          if (event.FeedbackId == 'feedback_step1'){   
            console.info('Customer Feedback: ', event.Text);
            xapi.command("UserInterface Message Alert Display", {
                Title: 'Feedback Sent'
              , Text: 'Thank you for you feedback! Have a great day!'
              , Duration: 5
            }).catch((error) => { console.error(error);}); 
          }
    });
  }
});