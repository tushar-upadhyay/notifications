var {Expo} = require("expo-server-sdk")
var express  = require("express")
var firebase = require("firebase")
var bodyParser = require("body-parser")
var app =express()
app.use(bodyParser.urlencoded({extended:false}))
var firebaseConfig = require("./firebaseConfig")
firebase.initializeApp(firebaseConfig)

var ref = firebase.database().ref();
var data;
app.get("/",(req,res)=>{
  res.sendFile(__dirname+"/public/index.html")
})
app.post("/send",(req,res)=>{
  var {attendance,url,body,title,open,password} = req.body
  if(password=="9993929488@t"){
    if(attendance=="null"){
      attendance =null
    }
   start(attendance,title,body,open,url)
    res.send("Success")
  }
  else{
    res.send("You Are Not Authorised to Send Notifications")
  }
})
function start(attendance,title,body,open,url){
ref.on("value", function(snapshot) {
 data= snapshot.val()
var d = Object.values(data)
d.map(async (x)=>{
  var res = await fetch(`https://lnctapi.herokuapp.com/?username=${x.username}&password=${x.password}`)
  res  = await res.json()
  await send(attendance,title,body,open,url,x.token,res.Percentage,res.Name)
})
}, function (error) {
  console.log("Error: " + error.code);
});
}

async function send(attendance,title,body,open,url,token,percentage,name){
let expo = new Expo();
let messages = [];
  if (!Expo.isExpoPushToken(token) ){
    console.error(`Push token ${token} is not a valid Expo push token`);
  }

    messages.push({
      to:token,
      sound: 'default',
      title:'Hey ! , ' + name,
      body: 'Your Attendance is  ' +percentage + " % ",
      data: { attendance: attendance ,title:title,body:body,open:open,url:url},
    })
  
 

let chunks = expo.chunkPushNotifications(messages);
let tickets = [];
(async () => {

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
      
    } catch (error) {
      console.error(error);
    }
  }
})();
let receiptIds = [];
for (let ticket of tickets) {
 
  if (ticket.id) {
    receiptIds.push(ticket.id);
  }
}

let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
(async () => {
  for (let chunk of receiptIdChunks) {
    try {
      let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      console.log(receipts);

      for (let receipt of receipts) {
        if (receipt.status === 'ok') {
          continue;
        } else if (receipt.status === 'error') {
          console.error(`There was an error sending a notification: ${receipt.message}`);
          if (receipt.details && receipt.details.error) {
           
            console.error(`The error code is ${receipt.details.error}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
})()
}

app.listen(process.env.PORT || 3000,()=>console.log("Server Running"))