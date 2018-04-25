'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createServerError;
function createServerError(Target, statusCode) {
  const ServerError = class ServerError extends Target {

    constructor() {
      super(...arguments);
      this.statusCode = statusCode;
    }
  };

  Reflect.defineProperty(ServerError, 'name', {
    value: Target.name
  });

  return ServerError;
}
//# sourceMappingURL=create-server-error.js.map