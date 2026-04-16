require('dotenv').config();

let client = null;

if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC')
) {
  const twilio = require('twilio');
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  console.log('Twilio er ikke sat korrekt op endnu. SMS er slået fra.');
}

async function sendSMS(to, body) {
  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('SMS ikke sendt. Twilio mangler eller er ikke sat korrekt op.');
    console.log('Til:', to);
    console.log('Besked:', body);
    return;
  }

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    console.log('SMS sendt:', message.sid);
  } catch (error) {
    console.error('Fejl ved SMS:', error.message);
  }
}

module.exports = { sendSMS };