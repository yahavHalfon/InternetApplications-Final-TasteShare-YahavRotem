import User from "../model/userModel";
import BaseController from "./baseController";

class UserController extends BaseController {
    constructor() {
        super(User);
    }
}

export default new UserController();