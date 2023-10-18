import {IUser} from "./../../@types/index";
import userService from "../../services/UserService";
import {
  changePasswordSchema,
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateUserSchema,
  verify2FSchema,
} from "./validation";
import {NextFunction, Request, Response} from "express";
import {errorResponse, generateToken, success} from "../../utils";
import {Conflict, InvalidInput} from "../../middlewares/error";
import HttpErrorCodes from "../../error/httpErrorCodes";
import {sendWelcomeMail} from "../MessagingController";

/**
 * Signup a user to throw an appropriate error
 * @param req
 * @param res
 * @param next
 * @returns
 */

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = registerSchema.validate(req.body);
    if (result.error) {
      throw new InvalidInput(result.error.details.join(','), HttpErrorCodes.INVALID_INPUT_PARAMETERS);
    }
    const findUser = await userService.signUp(req.body);
    return success("Account created successfully", findUser, 201, res);
  } catch (err) {
    next(err)
  }
};

/**
 * @param req
 * @param res
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = loginSchema.validate(req.body);

    if (result.error) {
      throw new InvalidInput(result.error.details.join(','), HttpErrorCodes.INVALID_INPUT_PARAMETERS);
    }

    const findUser: IUser = await userService.login(req.body);

    const payload = {
      email: findUser?.email,
      id: findUser.id,
      twoFactorAuth: findUser.twoFactorAuth,
      isVerified: findUser.isVerified,
    };

    const token = generateToken(payload);
    return success("Login successfully", {findUser, token}, 200, res);
  } catch (err) {
    next(err);
  }
};
/**
 * @param req
 * @param res
 * @returns
 */
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {token} = req.params;
    const user = await userService.verifyUser(token);
    const fullName = `${user.firstName} ${user.lastName}`;
    sendWelcomeMail(fullName, user.email);
    return success("Account activated successfully", user, 200, res);
  } catch (e) {
    next(e)
  }
};
/**
 *
 * @param req
 * @param res
 * @returns
 */
export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {email} = req.body;

    const result = emailSchema.validate(req.body);

    if (result.error) {
      throw new InvalidInput(result.error.details.join(','), HttpErrorCodes.INVALID_INPUT_PARAMETERS);
    }
    return await userService.resendVerification(email, res);
  } catch (e) {
    next(e)
  }
};
/**
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const checkEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {email} = req.body;
    const result = emailSchema.validate(req.body);

    if (result.error) {
      throw new InvalidInput(result.error.details.join(','), HttpErrorCodes.INVALID_INPUT_PARAMETERS);
    }
    const check = await userService.checkEmail(email);
    if (check) {
      return success(
        "Email is available for use",
        {email: email},
        200,
        res,
      );
    }
    throw new Conflict('Email already in use', HttpErrorCodes.EXISTING_USER_EMAIL)
  } catch (err) {
    next(err)
  }
};
/**
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const changeEmailLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = emailSchema.validate(req.body);

    if (result.error) {
      throw new InvalidInput(result.error.details.join(''), HttpErrorCodes.INVALID_INPUT_PARAMETERS);
    }

    const {email} = req.body;
    return await userService.changeEmailLink(email, res);
  } catch (err) {
    next(err)
  }
};
/**
 * @param req
 * @param res
 * @returns
 */
export const changeEmail = async (req: Request, res: Response) => {
  const {token} = req.params;

  if (!token) {
    return errorResponse("Provide token", 401, res);
  }

  return await userService.changeEmail(token, res);
};

/**
 * @param req
 * @param res
 * @returns
 */
export const changePassword = async (req: Request, res: Response) => {
  const result = changePasswordSchema.validate(req.body);

  if (result.error) {
    return errorResponse(result.error.details, 400, res);
  }

  const user = req.user as IUser;
  const findUser = await userService.changePassword(req.body, user.id, res);
  return success("Password changed successfully", findUser, 201, res);
};
/**
 * @param req
 * @param res
 * @returns
 */
export const forgotPassword = async (req: Request, res: Response) => {
  const {email} = req.body;

  const result = emailSchema.validate(req.body);

  if (result.error) {
    return errorResponse(result.error.details, 400, res);
  }

  const findUser = await userService.forgotPassword(email, res);
  return success("Forgot password link send successfully", findUser, 200, res);
};
/**
 * @param req
 * @param res
 * @returns
 */
export const resetPassword = async (req: Request, res: Response) => {
  const {token} = req.params;
  const {newPassword} = req.body;

  const result = resetPasswordSchema.validate(req.body);

  if (result.error) {
    return errorResponse(result.error.details, 400, res);
  }
  const findUser = await userService.resetPassword(token, newPassword, res);
  return success("Password change successfully", findUser, 200, res);
};
/**
 * @param req
 * @param res
 * @returns
 */
export const revalidateLogin = async (req: Request, res: Response) => {
  const {token} = req.params;
  const user = await userService.revalidateLogin(token, res);
  return success("Login successful", user, 200, res);
};
/**
 * @param req
 * @param res
 * @returns
 */
export const enable2fa = async (req: Request, res: Response) => {
  const {email} = req.user as IUser;

  const findUser = await userService.enable2fa(email, res);
  return success("Two factor authentication enabled", findUser, 201, res);
};
/**
 *
 * @param req
 * @param res
 * @returns
 */
export const send2faCode = async (req: Request, res: Response) => {
  const {email} = req.user as IUser;
  const findUser = await userService.send2faCode(email, res);
  return success("Two factor code sent", findUser, 201, res);
};

export const verify2faCode = async (req: Request, res: Response) => {
  const result = verify2FSchema.validate(req.body);

  if (result.error) {
    return errorResponse(result.error.details, 400, res);
  }

  const {code} = req.body;

  return await userService.resendVerification(code, res);
};

export const fetchAllUser = async (req: Request, res: Response) => {
  const users = await userService.fetchAllUser(res);
  return success("Fetched successfully", users, 200, res);
};

export const findUserById = async (req: Request, res: Response) => {
  const {userId} = req.params;
  const findUser = await userService.findUserById(userId, res);
  return success("Fetched successfully", findUser, 200, res);
};

export const deleteUserById = async (req: Request, res: Response) => {
  const {userId} = req.params;
  return await userService.deleteUserById(userId, res);
};

export const updateUserById = async (req: Request, res: Response) => {
  const result = updateUserSchema.validate(req.body);

  if (result.error) {
    return errorResponse(result.error.details, 400, res);
  }
  const {email} = req.user as IUser;
  return await userService.updateUserById(req.body, email, res);
};
