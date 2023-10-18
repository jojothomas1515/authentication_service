// import { AuthErrorHandler } from "./../../exceptions/AuthErrorHandler";
import {
  resetPasswordNotification,
  sendSignUpNotification,
  twoFactorAuthNotification,
  welcomeEmailNotification,
} from "../../controllers/UserController/messaging";
import {
  comparePassword,
  errorResponse,
  generateFourDigitPassword,
  generateToken,
  hashPassword,
  IUserPayload,
  success,
  verifyToken,
} from "../../utils/index";
import {IUserSignUp} from "../../interfaces/user/userSignupInterface";
import User from "../../models/User";
import {IUserService} from "./IUserService";
import {IUser} from "../../@types";
import {Response} from "express";
import {BadRequest, Conflict, ResourceNotFound, Unauthorized} from "../../middlewares/error";
import HttpErrorCodes from "../../error/httpErrorCodes";

export class UserService implements IUserService {
  public async findUserByEmail(email: string): Promise<User | null> {
    return await User.findOne({where: {email}});
  }

  /**
   *
   * @param payload
   * @returns
   */
  public async signUp(payload: IUserSignUp): Promise<User> {
    const {firstName, lastName, email, password} = payload;

    const findUser = await this.findUserByEmail(email);

    if (findUser) {
      throw new Conflict("User already exists", HttpErrorCodes.EXISTING_USER_EMAIL)
      // errorResponse("User already exists", 409, res);
    }

    const hashedPassword = await hashPassword(password);

    let newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      username: "",
    });

    // Generate token and send email
    const tPayload: IUserPayload = {
      email: newUser.email,
      id: newUser.id,
      firstName: newUser.firstName,
    };
    const token = generateToken(tPayload);
    const verificationLink = `${process.env.AUTH_FRONTEND_URL}/auth/verification-complete?token=${token}`;

    sendSignUpNotification(
      newUser.email,
      newUser.firstName,
      verificationLink,
    );
    // delete findUser.password;
    newUser = await User.findOne({where: {email}})
    return newUser;
  }

  /**
   *
   * @param payload
   * @returns
   */
  public async login(
    payload: {
      email: string;
      password: string;
    },
    // res: Response
  ): Promise<IUser> {
    const {email, password} = payload;
    const findUser = await this.findUserByEmail(email);

    if (!findUser) {
      throw new ResourceNotFound("User not found", HttpErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (findUser.isVerified === false) {
      throw new Unauthorized("Please verify your account", HttpErrorCodes.USER_NOT_VERIFIED);
    }

    const isMatch = await comparePassword(password, findUser.password);

    if (!isMatch) {
      throw new Unauthorized("Invalid password", HttpErrorCodes.INVALID_PASSWORD);
      // return errorResponse("Invalid username or password", 403, res);
    }
    return findUser;

  }

  /**
   *
   * @param token
   * @returns
   */
  public async verifyUser(
    token: string,
  ): Promise<User> {

    const decodedUser = verifyToken(token);

    if (!decodedUser) {
      throw new Unauthorized("Invalid token", HttpErrorCodes.INVALID_TOKEN);
    }

    const findUser = await this.findUserByEmail(decodedUser.email);

    if (!findUser) {
      throw new Unauthorized("Invalid token", HttpErrorCodes.INVALID_TOKEN);
    }

    if (findUser.isVerified) {
      throw new BadRequest("Account already verified. please login", HttpErrorCodes.EMAIL_ALREADY_VERIFIED);
    }

    findUser.isVerified = true;
    await findUser.save();
    const link = `${process.env.AUTH_FRONTEND_URL}`;
    welcomeEmailNotification(findUser.email, findUser.firstName, link);
    return findUser;

  }

  /**
   *
   * @param email
   * @returns
   */
  public async checkEmail(email: string): Promise<boolean> {
    const findUser = await this.findUserByEmail(email);

    return !findUser ? false : true;
  }

  /**
   *
   * @param email
   * @param res
   * @returns
   */
  public async changeEmailLink(email: string, res: Response): Promise<unknown> {
    try {
      const findUser = await this.findUserByEmail(email);

      if (!findUser) {
        return errorResponse("Email not found", 404, res);
      }

      const payload: IUserPayload = {
        email: findUser.email,
        id: findUser.id,
      };

      const token = await generateToken(payload);
      const verificationLink = `${process.env.AUTH_FRONTEND_URL}/auth/verification-complete?token=${token}`;
      sendSignUpNotification(
        findUser.email,
        findUser.firstName,
        verificationLink,
      );
      // sendVerificationEmail(findUser.firstName, findUser.email, token);
      return success(
        "Email change request link sent successfully",
        {
          id: findUser.id,
          email: findUser.email,
          token,
        },
        200,
        res,
      );
    } catch (err) {
      return errorResponse("Internal Server Error", 500);
    }
  }

  /**
   *
   * @param token
   * @param res
   * @returns
   */
  public async changeEmail(token: string, res: Response): Promise<unknown> {
    const decodedUser = verifyToken(token);

    if (!decodedUser) {
      return errorResponse("Invalid token", 401, res);
    }

    try {
      const findUser = await this.findUserByEmail(decodedUser.email);

      if (findUser) {
        return errorResponse("Email already in use", 409, res);
      }

      findUser.email = decodedUser.email;
      await findUser.save();
      return success(
        "Email changed successfully",
        {
          id: findUser.id,
          email: findUser.email,
        },
        200,
        res,
      );
    } catch (err) {
      return errorResponse("Internal Server Error", 500, res);
    }
  }

  /**
   *
   * @param payload
   * @param userId
   * @param res
   * @returns
   */
  public async changePassword(
    payload: { currentPassword: string; newPassword: string },
    userId: string,
    res: Response,
  ): Promise<IUser | unknown> {
    const {currentPassword, newPassword} = payload;

    const findUser = await User.findByPk(userId);

    if (!findUser) {
      return errorResponse("User not found", 404, res);
    }

    const matchPassword = await comparePassword(
      currentPassword,
      findUser.password,
    );
    if (!matchPassword) {
      return errorResponse("invalid current password", 403, res);
    }
    findUser.password = await hashPassword(newPassword);
    await findUser.save();
    return findUser;
  }

  /**
   *
   * @param email
   * @param res
   * @returns
   */
  public async forgotPassword(email: string, res: Response): Promise<unknown> {
    const findUser = await this.findUserByEmail(email);

    if (!findUser) {
      return errorResponse("User not found", 404, res);
    }

    if (findUser.isVerified === false) {
      return errorResponse("Account not verified not found", 403, res);
    }

    const payload: IUserPayload = {
      email: findUser.email,
      id: findUser.id,
      firstName: findUser.firstName,
    };
    const token = await generateToken(payload);
    const verificationLink = `${process.env.AUTH_FRONTEND_URL}/auth/reset-password?token=${token}`;

    resetPasswordNotification(
      findUser.email,
      findUser.firstName,
      verificationLink,
    );

    return findUser;
  }

  /**
   *
   * @param token
   * @param password
   * @param res
   * @returns
   */
  public async resetPassword(
    token: string,
    password: string,
    res: Response,
  ): Promise<unknown> {
    const decodedUser = verifyToken(token);

    if (!decodedUser) {
      return errorResponse("Invalid token", 401, res);
    }

    const findUser = await this.findUserByEmail(decodedUser.email);

    if (!findUser) {
      return errorResponse("User not found", 404, res);
    }

    findUser.password = await hashPassword(password);
    await findUser.save();
    return findUser;
  }

  /**
   *
   * @param token
   * @param res
   * @returns
   */
  public async revalidateLogin(token: string, res: Response): Promise<unknown> {
    const decodedUser = verifyToken(token);

    if (!decodedUser) {
      return errorResponse("Invalid token", 401, res);
    }

    const user = await User.findByPk(decodedUser.id);

    if (!user) {
      return errorResponse("User not found", 404, res);
    }

    res.header("Authorization", `Bearer ${token}`);

    return user;
  }

  /**
   *
   * @param email
   * @param res
   * @returns
   */
  public async enable2fa(email: string, res: Response): Promise<unknown> {
    const findUser = await this.findUserByEmail(email);

    if (!findUser) {
      return errorResponse("User not found", 404, res);
    }
    findUser.twoFactorAuth = true;
    await findUser.save();

    return findUser;
  }

  /**
   *
   * @param email
   * @param res
   * @returns
   */
  public async send2faCode(email: string, res: Response): Promise<unknown> {
    const findUser = await this.findUserByEmail(email);
    try {
      if (!findUser) {
        return errorResponse("User not found", 404, res);
      }

      if (findUser.twoFactorAuth === false) {
        return errorResponse("Not allowed", 403, res);
      }
      const code = await generateFourDigitPassword();

      await findUser.save();
      twoFactorAuthNotification(
        findUser.email,
        findUser.firstName,
        code,
      );
      return findUser;
    } catch (err) {
      return errorResponse("Internal Server Error", 500, res);
    }
  }

  public async fetchAllUser(res: Response): Promise<unknown> {
    try {
      const users = await User.findAll({
        attributes: [
          "id",
          "firstName",
          "username",
          "lastName",
          "email",
          "location",
          "country",
          "twoFactorAuth",
          "isVerified",
          "roleId",
          "provider",
        ],
      });
      return users;
    } catch (error) {
      return errorResponse("Internal Server Error", 500, res);
    }
  }

  /**
   *
   * @param id
   * @param res
   * @returns
   */
  public async findUserById(
    userId: string,
    res: Response,
  ): Promise<IUser | unknown> {
    try {
      const findUser = await User.findByPk(userId);

      if (!findUser) {
        return errorResponse("User not found", 404, res);
      }
      return findUser;
    } catch (error) {
      return errorResponse("Internal Server Error", 500, res);
    }
  }

  public async deleteUserById(
    userId: string,
    res: Response,
  ): Promise<IUser | unknown> {
    try {
      const findUser = await User.destroy({where: {id: userId}});

      if (!findUser) {
        return errorResponse("User not found", 404, res);
      }
      return success("Deleted successfully", null, 201, res);
    } catch (error) {
      return errorResponse("Internal Server Error", 500, res);
    }
  }

  public async updateUserById(
    payload: { firstName: string; lastName: string },
    email: string,
    res: Response,
  ): Promise<unknown> {
    const {firstName, lastName} = payload;
    try {
      const findUser = await this.findUserByEmail(email);

      if (!findUser) {
        return errorResponse("User not found", 404, res);
      }

      findUser.firstName = firstName;
      findUser.lastName = lastName;
      await findUser.save();
      return success(
        "Deleted successfully",
        {id: findUser.id, email: findUser.email},
        201,
        res,
      );
    } catch (error) {
      return errorResponse("Internal Server Error", 500, res);
    }
  }

  public async resendVerification(
    email: string,
    res: Response,
  ): Promise<unknown> {
    try {
      const findUser = await this.findUserByEmail(email);

      if (!findUser) {
        return errorResponse("User not found", 404, res);
      }

      if (findUser.isVerified === true) {
        return errorResponse("User already verified", 403, res);
      }

      const payload: IUserPayload = {
        email: findUser.email,
        id: findUser.id,
        firstName: findUser.firstName,
      };
      const token = generateToken(payload);
      const verificationLink = `${process.env.AUTH_FRONTEND_URL}/auth/verification-complete?token=${token}`;

      sendSignUpNotification(
        findUser.email,
        findUser.firstName,
        verificationLink,
      );
      // sendVerificationEmail(findUser.firstName, findUser.email, token);
      return success(
        "Verification email sent successfully",
        {
          id: findUser.id,
          email: findUser.email,
          token,
        },
        200,
        res,
      );
    } catch (error) {
      throw new Error("Internal Server Error");
      // return errorResponse("Internal Server Error", 500, res);
    }
  }
}

const userService = new UserService();
export default userService;
