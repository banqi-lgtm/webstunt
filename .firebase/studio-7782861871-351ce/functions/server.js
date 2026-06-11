const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrstudio7782861871351c = onRequest({}, (req, res) => server.then(it => it.handle(req, res)));
  