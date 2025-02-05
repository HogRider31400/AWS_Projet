const express = require('express');
const app = express();

app.use('/static', express.static(__dirname + '/static'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.listen(8080, () => {
  console.log('Server listening on http://localhost:8080');
});
