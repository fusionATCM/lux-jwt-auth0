import { isFunction } from "util";
import { sign, decode, verify } from "jsonwebtoken";
import set from "lodash.set";
import UnauthorizedError from "./errors/unauthorized-error";
import jwksRsa from "jwks-rsa";

export default function(options = {}) {
  const {
    // lux-jwt options
    secret,
    requestProperty = "user",
    isRevoked = false,

    // 'verify' options
    algorithms = false,
    audience = false,
    issuer = false,
    ignoreExpiration = false,
    ignoreNotBefore = false,
    subject = false,
    clockTolerance = 0,
    maxAge,
    clockTimestamp
  } = options;

  if (isRevoked && !isFunction(isRevoked)) {
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

  return async (request, response) => {
    if (!validCorsPreflight(request)) {
      const accessToken = getTokenFromHeader(request);

      let decodedAccessToken;
      let err;
      let secretStr = await getSecretFromAccessToken(accessToken);

      try {
        decodedAccessToken = verify(accessToken, secretStr, verifyOpts);

        if (isRevoked) {
          if (await isRevoked(request, decodedAccessToken)) {
            throw new UnauthorizedError("Token has been revoked");
          }
        }

        set(request, requestProperty, decodedAccessToken);
      } catch (e) {
        throw new UnauthorizedError(e.message || e);
      }
    }
  };
}

async function getSecretFromAccessToken(accesToken) {
  let decoded = decode(accesToken, { complete: true });
  const client = new jwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://impactalytics.eu.auth0.com/.well-known/jwks.json"
  });
  return new Promise(function(resolve, reject) {
    client.getSigningKey(decoded.header.kid, function(err, key) {
      if (err) {
        reject(err);
      }
      let secret = key.publicKey || key.rsaPublicKey;
      resolve(secret);
    });
  });
}

/**
 * Checks if an OPTIONS request with the access-control-request-headers containing authorization is being made
 * @param request
 * @returns {boolean}
 */
function validCorsPreflight(request) {
  if (
    request.method === "OPTIONS" &&
    request.headers.has("access-control-request-headers")
  ) {
    return request.headers
      .get("access-control-request-headers")
      .split(",")
      .map(function(header) {
        return header.trim();
      })
      .includes("authorization");
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
    throw new UnauthorizedError("No authorization header present");
  }

  const parts = request.headers.get("authorization").split(" ");

  if (parts.length === 2) {
    const scheme = parts[0];
    const credentials = parts[1];

    if (/^Bearer$/i.test(scheme)) {
      return credentials;
    } else {
      throw new UnauthorizedError(
        'Bad Authorization header format. Format is "Authorization: Bearer token"'
      );
    }
  } else {
    throw new UnauthorizedError(
      'Bad Authorization header format. Format is "Authorization: Bearer token"'
    );
  }
}

export { sign, decode, verify };
