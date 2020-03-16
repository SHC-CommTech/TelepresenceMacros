/**********************************************************
PROGRAM HEADER
STANFORD HEALTH CARE - Technology & Digital Solutions
Programmer: Justin Scord
Last Modified Date: 2020-Feb-17
Build Version: 4.3.0
**********************************************************/

const xapi = require('xapi');
const SERVICE_NOW_INSTANCE_URL = 'stanfordhctest.service-now.com'; // Specify a URL to a service like serviceNow etc.
const MONITORING_URL = 'https://' + SERVICE_NOW_INSTANCE_URL + '/api/now/v1/table/incident'; // Specify a URL to a service like serviceNow etc.
const CHECKUSER_URL = 'https://' + SERVICE_NOW_INSTANCE_URL + '/api/now/table/sys_user?sysparm_query=user_name=';
const CONTENT_TYPE = "Content-Type: application/json";
const SERVICENOW_USERNAMEPWD_BASE64 = 'Y2lzY29fdGVsZXByZXNlbmNlOlN0YW5mb3JkQDEyMw=='; // format is  "username:password" for basic Authorization. This needs to be base64-encoded. Use e.g. https://www.base64encode.org/ to do this
const SERVICENOW_AUTHTOKEN = "Authorization: Basic " + SERVICENOW_USERNAMEPWD_BASE64;

var sysID;
var userSID;
var userPhoneNumber;
var userFullName;
var systemInfo = {
    softwareVersion : '',
    systemName : '',
    softwareReleaseDate : ''
};

function working(text){
  xapi.command("UserInterface Message Alert Display", {
    Title: 'Working...',
    Text: text,
    Duration: 10
  }).catch((error) => { console.error(error);});
}

function buildTicket(func_userName){
  xapi.command("UserInterface Message Prompt Display", {
    Title: "Thanks " + func_userName +"!",
          Text: 'Please select what the problem area is',
          FeedbackId: 'roomfeedback_step1',
          'Option.1':'Cable Management',
          'Option.2':'Audiovisual',
          'Option.3': 'Other',
        }).catch((error) => { console.error(error); });
}

function sendMonitoringUpdatePost(message){
  console.log('Message sendMonitoringUpdatePost: ' + message);
  var messagecontent = {
    description: systemInfo.softwareVersion,
    short_description: systemInfo.systemName + ': ' + message
  };
    xapi.command('HttpClient Post', {'Header': [SERVICENOW_AUTHTOKEN, CONTENT_TYPE]  , 'Url':MONITORING_URL , 'AllowInsecureHTTPS': 'False'}, JSON.stringify(messagecontent));
}

function getServiceNowIncidentIdFromURL(url){

    return xapi.command('HttpClient Get', { 'Header': [CONTENT_TYPE, SERVICENOW_AUTHTOKEN] , 'Url':url, 'AllowInsecureHTTPS': 'False'});
}
function SIDCheck(SID){
    if(SID.match(/^[sS][0-9]{7}$/) !== null){
      return true;
    }
    else if(SID === ""){
      return true;
    }
    else{
      return false;
    }
}

function raiseTicket(message, assignment_group, business_service, configItem, category){
  console.log('Message raiseTicket: ' + message);
  assignment_group = typeof assignment_group !== 'undefined' ? assignment_group : "Communications Technologies";
  business_service = typeof business_service !== 'undefined' ? business_service : "Communications";
  configItem = typeof configItem !== 'undefined' ? configItem : "AV Services";
  category = typeof category !== 'undefined' ? category : "Infrastructure";
  var description;
  if(message.length > 170){
    description = "Reported by AV system for user: " + userSID + " | " + userFullName + "\n \n" + message;
    message = "There is a user reported issue in " + systemInfo.systemName;
  }
  else {
    description = "Reported by AV system for user: " + userSID + " " + userFullName;
  }
  var messagecontent = {
    "short_description": message,
    "impact":"3",
    "urgency":"3",
    "assignment_group": assignment_group,
    "u_business_service": business_service,
    "cmdb_ci":configItem,
    "category":category,
    "u_location_details": systemInfo.systemName,
    "contact_type":"System Generated",
    "caller_id": userFullName,
    "u_callback_number": userPhoneNumber,
    "description": description,
    "sysparm_input_display_value": "True"
  };
  working("Please wait while we fetch your ticket number.");
  
  //This block of stuff posts the incident to ServiceNow and Returns the Ticket #
  xapi.command('HttpClient Post', { 'Header': [CONTENT_TYPE, SERVICENOW_AUTHTOKEN] , 'Url':MONITORING_URL, 'AllowInsecureHTTPS': 'False'}
  , JSON.stringify(messagecontent)).then((result) => {
    const serviceNowIncidentLocation = result.Headers.find(x => x.Key === 'Location');
    var serviceNowIncidentURL = serviceNowIncidentLocation.Value;
    var  serviceNowIncidentTicket;
    getServiceNowIncidentIdFromURL(serviceNowIncidentURL).then(
    (result) => {
      var body = result.Body;
      console.log('Got this from getServiceNowIncidentIdFromURL: ' + JSON.stringify(result));
      serviceNowIncidentTicket =  JSON.parse(body).result.number;
      console.log("ServiceNow Incident Number: " + serviceNowIncidentTicket);
      xapi.command("UserInterface Message Alert Display", {
        Title: 'Technology and Digital Soluions Receipt',
        Text:  'Your ticket number is ' + serviceNowIncidentTicket + ". We're on the case!",
        Duration: 10
        }).catch((error) => { console.error(error);});
      });
      console.log('Got this from raiseTicket: ' + JSON.stringify(result));
  });
}

//This runs when you first click the "Report Issue" button.
xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
  if(event.PanelId == 'reportissue'){
    xapi.command("UserInterface Message TextInput Display", {
            Duration: 0,
            FeedbackId: "roomfeedback_getSID",
            InputType: "SingleLine",
            KeyboardState: "Open",
            Placeholder: "(If you do not have an SID, leave blank)",
            SubmitText: "Submit",
            Text: "Please Provide Your SID.",
            Title: "ServiceNow (Dogfooding Edition)",
          }).catch((error) => { console.error(error); });
  }
});

//This block of stuff checks ServiceNow for a Valid SID.
xapi.event.on('UserInterface Message TextInput Response', (event) => {
  switch(event.FeedbackId){
    case 'roomfeedback_step2_other':
      raiseTicket('There is a user reported issue in ' + systemInfo.systemName + ': ' + event.Text, "Service Desk", "", "", "");
      break;
    case 'roomfeedback_step2_otherav':
      raiseTicket('There is a user reported issue in ' + systemInfo.systemName + ': ' + event.Text);
      break;
	case 'roomfeedback_getSID':
	  var bool = SIDCheck(event.Text);
	  var userName;
    if(bool === true){
      if(event.Text){
      working("Please wait while we get your account information.");
      xapi.command('HttpClient Get', {'AllowInsecureHTTPS': 'False', 'Header': [SERVICENOW_AUTHTOKEN, CONTENT_TYPE]  , 'Url':CHECKUSER_URL + event.Text}).then((result) => {
        var body = result.Body;
        console.log('Got this from SID Check: ' + JSON.stringify(result));
        userName = JSON.parse(body).result[0].first_name;
        sysID = JSON.parse(body).result[0].sys_id;
        userSID = JSON.parse(body).result[0].user_name;
        userPhoneNumber = JSON.parse(body).result[0].phone;
        userFullName = JSON.parse(body).result[0].name;
        console.log("Reporting on Behalf of: " + userName + " | " + sysID);
        buildTicket(userName);
      }).catch((error) => {
          console.error(error, "using default user settings.");
          xapi.command("UserInterface Message Alert Display", {
            Title: "System Error",
            Text: "Something went Wrong. Please try again.",
          }).catch((error) => { console.error(error); });
        });
      }
      else{
        userName ="Stanford User";
        sysID = "";
        userPhoneNumber = '';
        userFullName = '';
        buildTicket(userName);
      }
    }
    else{
        xapi.command("UserInterface Message Alert Display", {
          Title: "User Input Error",
          Text: "Your entry was not valid. Please try again.",
        }).catch((error) => { console.error(error); });
    }
  }
});

xapi.event.on('UserInterface Message Prompt Response', (event) => {
  switch(event.FeedbackId){
    case 'roomfeedback_step1':
      switch(event.OptionId){
        case '1':
          xapi.command("UserInterface Message Prompt Display", {
            Title: "Cable Management Issue",
              Text: 'Please select what the problem seems to be',
              FeedbackId: 'roomfeedback_step2_cm',
              'Option.1':'Presentation Cable is Missing',
              'Option.2':'DisplayPort Adapter is Missing',
              'Option.3':'USB-C Adapter is Missing',
              'Option.4':'Cables are tangled and need to be managed',
              'Option.5':'Other Issue'
          }).catch((error) => { console.error(error); });
          break;
        case '2':
          xapi.command("UserInterface Message Prompt Display", {
            Title: "A/V Issue reporting",
              Text: 'Please select what the problem seems to be',
              FeedbackId: 'roomfeedback_step2_av',
              'Option.1':'Screen is Black.',
              'Option.2':'No Sound out from the Display',
              'Option.3':'Far End Caller could not Hear me.',
              'Option.4':'Call quality was bad.',
              'Option.5':'Other Issue'
          }).catch((error) => { console.error(error); });
          break;
        case '3':
          xapi.command("UserInterface Message TextInput Display", {
            Duration: 0,
            FeedbackId: "roomfeedback_step2_other",
            InputType: "SingleLine",
            KeyboardState: "Open",
            Placeholder: "Describe issue here",
            SubmitText: "Next",
            Text: "Please enter a short description of the issue",
            Title: "Issue info",
          }).catch((error) => { console.error(error); });
          break;
        }
        break;
      case 'roomfeedback_step2_cm':
        if(event.OptionId < 5){
          var issue = [
            '',
            'is Missing Presentation Cable',
            'is Missing DisplayPort to HDMI Adapter',
            'is Missing USB-C to HDMI Adapter',
            'has poor cable management and needs attention.'
          ];
          raiseTicket(systemInfo.systemName + issue[parseInt(event.OptionId)]);
        }
        else{
          xapi.command("UserInterface Message TextInput Display", {
            Duration: 0,
            FeedbackId: "roomfeedback_step2_otherav",
            InputType: "SingleLine",
            KeyboardState: "Open",
            Placeholder: "Describe issue here",
            SubmitText: "Next",
            Text: "Please enter a short description of the issue",
            Title: "Issue info",
          }).catch((error) => { console.error(error); });
        }
        break;
      case 'roomfeedback_step2_av':
        if(event.OptionId == '1'){
          xapi.command("UserInterface Message Prompt Display", {
            Title: "A/V Issue reporting",
            Text: 'Please Check the Lower Left Side on the Back of the Screen and make sure it is not manually powered off.',
            FeedbackId: 'roomfeedback_blackscreen',
              'Option.1':'That Fixed It!',
              'Option.2':'The Display is Powered on, but still black',
              'Option.3':"I'm not sure what to check :-|",
              'Option.4':"I don't have time to check"
          }).catch((error) => { console.error(error); });
        }
        else if(5>event.OptionId>1){
          var issue = [
            "",
            "",
            ' has no sound from the display',
            ' has a problem with the microphones where the far end user cannot hear the room',
            ' is having an issue with call quality'
          ];
          raiseTicket(systemInfo.systemName + issue[parseInt(event.OptionId)]);
          }
        else{
          xapi.command("UserInterface Message TextInput Display", {
            Duration: 0,
            FeedbackId: "roomfeedback_step2_otherav",
            InputType: "SingleLine",
            KeyboardState: "Open",
            Placeholder: "Describe issue here",
            SubmitText: "Next",
            Text: "Please enter a short description of the issue",
            Title: "Issue info",
          }).catch((error) => { console.error(error); });
        }
        break;
      case 'roomfeedback_blackscreen':
        if(event.OptionId > 1){
            raiseTicket(systemInfo.systemName + 'is showing a black screen. End user cannot troubleshoot.');
        }
      break;
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
