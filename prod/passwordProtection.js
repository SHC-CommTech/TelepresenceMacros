/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Jan-16
Build Version: 1.0.0
**********************************************************/

const xapi = require('xapi');
const userPass = 'test';
const defaultPrompt = 'Please Enter Password';
let secure = true;

function promptforPassword(text){
  xapi.command("UserInterface Message TextInput Display", {
          InputType: "Password",
          Placeholder: "Password",
          Title: "Unlock Panel",
          Text: text,
          SubmitText: "Enter",
          FeedbackId: "password_fb",
          }).catch((error) => { console.error(error); });
}  

xapi.status.on("Standby State", (standby) =>{
    if(standby === "Off"){
      promptforPassword(defaultPrompt);
    }
    if(standby === "Standby"){
      secure = true;
      console.log("Secure: ", secure);
    }
});

xapi.event.on('UserInterface Message TextInput Response', (event) => {
  if(event.FeedbackId == "password_fb"){
    if(event.Text == userPass){
      secure = false;
      console.log("Secure: ", secure);
    }
    else{
      promptforPassword("Incorrect Password. Please Try Again.");
    }
  }
});

xapi.event.on("UserInterface Message TextInput Clear", event => {
  if(event.FeedbackId === "password_fb"){
    if(secure === true){
      promptforPassword(defaultPrompt);
    }
  }
});
