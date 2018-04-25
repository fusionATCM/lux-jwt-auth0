'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createServerError = require('./create-server-error');

var _createServerError2 = _interopRequireDefault(_createServerError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);

    return this;
  }
}

exports.default = (0, _createServerError2.default)(UnauthorizedError, 403);
//# sourceMappingURL=unauthorized-error.js.map