import User from "../model/userModel";
import type { IUser } from "../model/userModel";
import BaseController from "./baseController";

class UserController extends BaseController<IUser> {
    constructor() {
        super(User);
    }
}

export default new UserController();