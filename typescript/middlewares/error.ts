import {NextFunction, Request, Response} from "express";
import HttpErrorCodes from '../error/httpErrorCodes'

class HttpError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(statusCode: number, message: string, errorCode: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

class BadRequest extends HttpError {
  constructor(message: string, errorCode: string) {
    super(400, message, errorCode);
  }
}

class ResourceNotFound extends HttpError {
  constructor(message: string, errorCode: string) {
    super(404, message, errorCode);
  }
}

class Unauthorized extends HttpError {
  constructor(message: string, errorCode: string) {
    super(401, message, errorCode);
  }
}

class Forbidden extends HttpError {
  constructor(message: string, errorCode: string) {
    super(403, message, errorCode);
  }
}

class Conflict extends HttpError {
  constructor(message: string, errorCode: string) {
    super(409, message, errorCode);
  }
}

class InvalidInput extends HttpError {
  constructor(message: string, errorCode: string) {
    super(422, message, errorCode);
  }
}

class ServerError extends HttpError {
  constructor(message: string, errorCode: string) {
    super(500, message, errorCode);
  }
}

const routeNotFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new ResourceNotFound(`Route not found: ${req.originalUrl}`, HttpErrorCodes.UNKNOWN_ENDPOINT);
  next(error);
};

const errorHandler = (
  err: HttpError | Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): Response => {
  if (err instanceof HttpError) {
    const {statusCode, errorCode, message} = err;
    return res.status(statusCode).json({
      errorCode,
      statusCode,
      message,
    });
  }
  console.log(err)
  return res.status(500).json({error: "Internal Server Error", statusCode: 500})
};

export {
  ServerError,
  Conflict,
  Forbidden,
  Unauthorized,
  ResourceNotFound,
  BadRequest,
  InvalidInput,
  HttpError,
  routeNotFound,
  errorHandler,
};
