const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const cors = require('cors');
const app = express();
app.use(cors());
const port = 5000;
require('dotenv').config();


// Fill the appID and appCertificate key given by Agora.io
const appId = process.env.REACT_APP_AGORA_APP_ID;
const appCertificate = process.env.REACT_APP_AGORA_APP_CERTIFICATE;

app.get('/api/token', (req, res) => {
  const channelName = req.query.channelId;
  if (!channelName) {
    return res.status(400).send('Channel is required');
  }
  // Role could be RtcRole.PUBLISHER, RtcRole.SUBSCRIBER, RtcRole.ADMIN
  const role = RtcRole.PUBLISHER;

  // Privilege is valid for 24 hours
  const expirationTimeInSeconds = 3600 * 24;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Build the token
  const token = RtcTokenBuilder.buildTokenWithAccount(appId, appCertificate, channelName, 0, role, privilegeExpiredTs);
  
  return res.json({ token });
});

app.listen(port, () => console.log(`Token server listening on port ${port}!`));