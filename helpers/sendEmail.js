const sendGridMail = require('@sendgrid/mail');

const htmlEmail = ({text,header})=>{
    return `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TFG - Notification</title>
      <style> 
          body {
          margin: 0 auto;
          padding: 0;
          background: #222;
        }
        
        .left {
          left: 25px;
        }
        
        .right {
          right: 25px;
        }
        
        .center {
          text-align: center;
        }
        
        .bottom {
          position: absolute;
          bottom: 25px;
        }
        
        #gradient {
          background: #999955;
          background-image: linear-gradient(#DAB046 20%, #D73B25 20%, #D73B25 40%, #C71B25 40%, #C71B25 60%, #961A39 60%, #961A39 80%, #601035 80%);
          margin: 0 auto;
          margin-top: 100px;
          width: 100%;
          height: 150px;
        }
        
        #gradient:after {
          content: "";
          position: absolute;
          background: #E9E2D0;
          left: 50%;
          margin-top: -67.5px;
          margin-left: -270px;
          padding-left: 20px;
          border-radius: 5px;
          width: 520px;
          height: 275px;
          z-index: -1;
        }
        
        #card {
          position: absolute;
          width: 450px;
          height: 225px;
          padding: 25px;
          padding-top: 20px;
          padding-bottom: 0;
          left: 50%;
          top: 67.5px;
          margin-left: -250px;
          background: #E9E2D0;
          box-shadow: -20px 0 35px -25px black, 20px 0 35px -25px black;
          z-index: 5;
        }
        
        #card img {
          width: 150px;
          float: left;
          border-radius: 5px;
          margin-right: 20px;
        }
        #card h2 {
          font-family: courier;
          color: #333;
          margin: 0 auto;
          padding: 0;
          font-size: 15pt;
        }
        
        #card p {
          font-family: courier;
          color: #555;
          font-size: 13px;
        }
        
        #card span {
          font-family: courier;
        }
        
        button {
        margin-letf = 10px;
        background: #4F6B76;
        border: 1px solid #000000;
        box-sizing: border-box;
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
        border-radius: 10px;
          color:white;
          
        }
      </style>
    </head>
    <body >
      <div id="gradient"></div>
      <div id="card">
        <img src="https://i.ibb.co/vXhfSCy/logoTFG.png" alt="Logo TFG"/>
        <h2>${header}</h2>
        <p>${text}</p>
        <button>Corre que te lo pierdes!!</button>
      </div>
    </body>
    </html>`;
}

const msg = ({subject,toEmail,text,header})=>{
    return {
    to: toEmail, // Change to your recipient
    from: 'zpbarto@gmail.com', // Change to your verified sender
    subject: subject,
    text: text,
    html: htmlEmail({text,header})
  }
}

const sendIndividualEmail = async({subject,toEmail,text,header}) => {
    //Establecer apiKey
    sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
    //envier email
    try {
        await sendGridMail.send(msg({subject,toEmail,text,header}))
    } catch (error) {
      throw new Error(error);
    }
    
}

const sendMultipleEmails = async({subject,toEmail,text,header}) => {
  //set apiKey
  sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
  //send email
  try {
      await sendGridMail.sendMultiple(msg({subject,toEmail,text,header}))
  } catch (error) {
    throw new Error(error);
  }
  
}

module.exports = {
  sendIndividualEmail,
  sendMultipleEmails
};