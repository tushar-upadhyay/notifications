var {Expo} = require("expo-server-sdk")
var express  = require("express")
var app = express()
app.use(express.urlencoded({ extended: true }))

function send(attendance,title,body,open,url){
let expo = new Expo();
let messages = [];
var somePushTokens = ["ExponentPushToken[PV9K5dD70OnRm3pSpCa6w7]"]
for (let pushToken of somePushTokens) {
  
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    continue;
  }
  messages.push({
    to: pushToken,
    sound: 'default',
    body: 'This is a test notification',
    data: { attendance: attendance ,title:title,body:body,open:open,url:url},
  })
}
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
app.get("/",(req,res)=>{
  res.sendFile(__dirname + "/public/index.html")
})
app.post("/send",(req,res)=>{
  let {attendance,title,body,open,url} = req.body
  if(attendance=="no"){
    attendance=null
  }
  send(attendance,title,body,open,url)
  res.send("tushar")
})
app.listen(3000)