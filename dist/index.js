"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.verify = exports.decode = exports.sign = undefined;

let getSecretFromAccessToken = (() => {
  var _ref2 = _asyncToGenerator(function* (accesToken) {
    let decoded = (0, _jsonwebtoken.decode)(accesToken, { complete: true });
    console.log("decoded token", decoded);

    const client = new _jwksRsa2.default({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: "https://impactalytics.eu.auth0.com/.well-known/jwks.json"
    });
    return new Promise(function (resolve, reject) {
      client.getSigningKey(decoded.header.kid, function (err, key) {
        if (err) {
          reject(err);
        }
        // Provide the key.
        console.log("KEY", key);
        let secret = key.publicKey || key.rsaPublicKey;
        resolve(secret);
      });
    });
  });

  return function getSecretFromAccessToken(_x4) {
    return _ref2.apply(this, arguments);
  };
})();

/**
 * Checks if an OPTIONS request with the access-control-request-headers containing authorization is being made
 * @param request
 * @returns {boolean}
 */


exports.default = function () {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const secret = options.secret;
  var _options$requestPrope = options.requestProperty;
  const requestProperty = _options$requestPrope === undefined ? "user" : _options$requestPrope;
  var _options$isRevoked = options.isRevoked;
  const isRevoked = _options$isRevoked === undefined ? false : _options$isRevoked;
  var _options$algorithms = options.algorithms;
  const algorithms = _options$algorithms === undefined ? false : _options$algorithms;
  var _options$audience = options.audience;
  const audience = _options$audience === undefined ? false : _options$audience;
  var _options$issuer = options.issuer;
  const issuer = _options$issuer === undefined ? false : _options$issuer;
  var _options$ignoreExpira = options.ignoreExpiration;
  const ignoreExpiration = _options$ignoreExpira === undefined ? false : _options$ignoreExpira;
  var _options$ignoreNotBef = options.ignoreNotBefore;
  const ignoreNotBefore = _options$ignoreNotBef === undefined ? false : _options$ignoreNotBef;
  var _options$subject = options.subject;
  const subject = _options$subject === undefined ? false : _options$subject;
  var _options$clockToleran = options.clockTolerance;
  const clockTolerance = _options$clockToleran === undefined ? 0 : _options$clockToleran,
        maxAge = options.maxAge,
        clockTimestamp = options.clockTimestamp;


  if (isRevoked && !(0, _util.isFunction)(isRevoked)) {
    throw new Error("Token revocation must be a function!");
  }

  const verifyOpts = {
    algorithms,
    audience,
    issuer,
    ignoreExpiration,
    ignoreNotBefore,
    subject,
    clockTolerance,
    maxAge,
    clockTimestamp
  };

  return (() => {
    var _ref = _asyncToGenerator(function* (request, response) {
      if (!validCorsPreflight(request)) {
        const accessToken = getTokenFromHeader(request);

        let decodedAccessToken;
        let err;
        let secretStr = yield getSecretFromAccessToken(accessToken);

        try {
          console.log("accessToken", accessToken);
          console.log("secretStr", secretStr);
          console.log("verifyOpts", verifyOpts);

          decodedAccessToken = (0, _jsonwebtoken.verify)(accessToken, secretStr, verifyOpts);

          if (isRevoked) {
            if (yield isRevoked(request, decodedAccessToken)) {
              throw new _unauthorizedError2.default("Token has been revoked");
            }
          }

          (0, _lodash2.default)(request, requestProperty, decodedAccessToken);
        } catch (e) {
          throw new _unauthorizedError2.default(e.message || e);
        }
      }
    });

    return function (_x2, _x3) {
      return _ref.apply(this, arguments);
    };
  })();
};

var _util = require("util");

var _jsonwebtoken = require("jsonwebtoken");

var _lodash = require("lodash.set");

var _lodash2 = _interopRequireDefault(_lodash);

var _unauthorizedError = require("./errors/unauthorized-error");

var _unauthorizedError2 = _interopRequireDefault(_unauthorizedError);

var _jwksRsa = require("jwks-rsa");

var _jwksRsa2 = _interopRequireDefault(_jwksRsa);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function validCorsPreflight(request) {
  if (request.method === "OPTIONS" && request.headers.has("access-control-request-headers")) {
    return request.headers.get("access-control-request-headers").split(",").map(function (header) {
      return header.trim();
    }).includes("authorization");
  } else {
    return false;
  }
}

/**
 * Retrieves the JWT from the authorization header
 * @param request
 * @returns {string} The JWT
 */
function getTokenFromHeader(request) {
  if (!request.headers || !request.headers.has("authorization")) {
    throw new _unauthorizedError2.default("No authorization header present");
  }

  const parts = request.headers.get("authorization").split(" ");

  if (parts.length === 2) {
    const scheme = parts[0];
    const credentials = parts[1];

    if (/^Bearer$/i.test(scheme)) {
      return credentials;
    } else {
      throw new _unauthorizedError2.default('Bad Authorization header format. Format is "Authorization: Bearer token"');
    }
  } else {
    throw new _unauthorizedError2.default('Bad Authorization header format. Format is "Authorization: Bearer token"');
  }
}

exports.sign = _jsonwebtoken.sign;
exports.decode = _jsonwebtoken.decode;
exports.verify = _jsonwebtoken.verify;
//# sourceMappingURL=index.js.map