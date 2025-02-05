const { hash } = require('ohash');

const createDeviceFingerprint = (req) => {
  const components = [
    req.headers['user-agent'],
    req.headers['accept-language'],
    req.ip,
    req.headers['sec-ch-ua-platform']
  ];
  return hash(components.join('|'));
};

module.exports = (req, res, next) => {
  req.deviceFingerprint = createDeviceFingerprint(req);
  next();
};