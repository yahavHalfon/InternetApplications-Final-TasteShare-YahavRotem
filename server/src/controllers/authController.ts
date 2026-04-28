import { Request, Response } from "express";
import User from "../model/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "crypto";
import slugify from "slugify";

const sendError = (status: number, message: string, res: Response) => {
    res.status(status).json({ error: message });
};

type GeneratedTokens = {
    token: string,
    refreshToken: string
};

type PublicUser = {
    id: string;
    email: string;
    name: string;
    username: string;
    avatarUrl: string;
    bio: string;
    website: string;
    location: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const oauthClient = new OAuth2Client();
const MAX_USERNAME_LENGTH = 30;

export const getJWTSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    return secret;
};

const generateToken = (userId: string): GeneratedTokens => {
    const secret = getJWTSecret();
    if (!process.env.JWT_EXPIRES_IN) {
        throw new Error("JWT_EXPIRES_IN is not defined");
    }
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN, 10);
    const token = jwt.sign(
        { _id: userId },
        secret,
        { expiresIn: expiresIn }
    );

    if (!process.env.REFRESH_TOKEN_EXPIRES_IN) {
        throw new Error("REFRESH_TOKEN_EXPIRES_IN is not defined");
    }
    const refreshExpiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 10);
    const refreshToken = jwt.sign(
        { _id: userId, rand: randomUUID() },
        secret,
        { expiresIn: refreshExpiresIn }
    );
    return { token, refreshToken };
}

const normalizeUsername = (name: string): string =>
    slugify(name, { lower: true, strict: true, trim: true, replacement: "" }).slice(0, MAX_USERNAME_LENGTH);

const buildUsernameWithSuffix = (baseUsername: string, suffix: number): string => {
    const suffixString = `${suffix}`;
    const maxBaseLength = MAX_USERNAME_LENGTH - suffixString.length;
    return `${baseUsername.slice(0, maxBaseLength)}${suffixString}`;
};

const resolveAvailableUsername = async (preferredUsername: string): Promise<string> => {
    let candidate = preferredUsername;
    let suffix = 1;

    while (await User.exists({ username: candidate })) {
        candidate = buildUsernameWithSuffix(preferredUsername, suffix);
        suffix += 1;

        if (suffix > 9999) {
            candidate = `${preferredUsername.slice(0, 24)}${randomUUID().replace(/-/g, "").slice(0, 6)}`;
            if (!(await User.exists({ username: candidate }))) {
                break;
            }
            suffix = 1;
        }
    }

    return candidate;
};

const buildPublicUser = (user: InstanceType<typeof User>): PublicUser => {
    return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        website: user.website,
        location: user.location,
    };
};

const createAuthResponse = (user: InstanceType<typeof User>, tokens: GeneratedTokens) => ({
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: buildPublicUser(user),
});

export const register = async (req: Request, res: Response) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const requestedUsername = typeof req.body.username === "string" ? normalizeUsername(req.body.username) : "";
    const bio = typeof req.body.bio === "string" ? req.body.bio.trim() : "";
    const location = typeof req.body.location === "string" ? req.body.location.trim() : "";
    const website = typeof req.body.website === "string" ? req.body.website.trim() : "";
    const avatarUrl = req.file
        ? `/uploads/profiles/${req.file.filename}`
        : typeof req.body.avatarUrl === "string"
            ? req.body.avatarUrl.trim()
            : "";

    if (!email || !password) {
        return sendError(400, "Email and password are required", res);
    }
    if (!emailPattern.test(email)) {
        return sendError(400, "Invalid email format", res);
    }
    if (password.length < 8) {
        return sendError(400, "Password must be at least 8 characters", res);
    }
    const emailPrefix = email.split("@")[0] ?? "";
    const baseUsername = requestedUsername || normalizeUsername(name) || normalizeUsername(emailPrefix);
    if (!baseUsername) {
        return sendError(400, "Username is required", res);
    }

    try {
        const existingByEmail = await User.findOne({ email }).select("_id").lean();

        if (existingByEmail) {
            return sendError(409, "User already exists", res);
        }

        if (requestedUsername && await User.findOne({ username: requestedUsername }).select("_id").lean()) {
            return sendError(409, "Username is already taken", res);
        }

        const username = requestedUsername || await resolveAvailableUsername(baseUsername);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            username,
            bio,
            location,
            website,
            avatarUrl,
        });
        const savedUser = await newUser.save();
        const tokens = generateToken(savedUser._id.toString());
        savedUser.refreshTokens.push(tokens.refreshToken);
        await savedUser.save();
        res.status(201).json(createAuthResponse(savedUser, tokens));
    } catch (err) {
        const mongoError = err as {
            code?: number;
            keyPattern?: Record<string, number>;
            keyValue?: Record<string, unknown>;
            message?: string;
        };
        if (mongoError.code === 11000) {
            if (mongoError.keyPattern?.email) {
                return sendError(409, "User already exists", res);
            }
            if (mongoError.keyPattern?.username || Object.prototype.hasOwnProperty.call(mongoError.keyValue ?? {}, "username") || /username/i.test(mongoError.message ?? "")) {
                return sendError(409, "Username is already taken", res);
            }
            return sendError(409, "User already exists", res);
        }
        return sendError(400, err instanceof Error ? err.message : "Error registering user", res);
    }
};

export const login = async (req: Request, res: Response) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || !password) {
        return sendError(400, "Email and password are required", res);
    }
    if (!emailPattern.test(email)) {
        return sendError(400, "Invalid email format", res);
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return sendError(400, "Invalid email or password", res);
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendError(400, "Invalid email or password", res);
        }

        const tokens = generateToken(user._id.toString());
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();
        res.status(200).json(createAuthResponse(user, tokens));
    } catch {
        return sendError(500, "Internal server error", res);
    }
};

export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return sendError(400, "Refresh token is required", res);
    }

    try {
        const secret = getJWTSecret();
        const decoded = jwt.verify(refreshToken, secret) as { _id: string };
        const user = await User.findById(decoded._id);
        if (!user) {
            return sendError(401, "Invalid refresh token", res);
        }
        if (!user.refreshTokens.includes(refreshToken)) {
            user.refreshTokens = [];
            await user.save();
            return sendError(401, "Invalid refresh token", res);
        }
        const tokens = generateToken(user._id.toString());
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();
        res.status(200).json(createAuthResponse(user, tokens));
    } catch (err) {
        if (err instanceof Error && err.message === "JWT_SECRET is not defined") {
            return sendError(500, err.message, res);
        }
        return sendError(401, "Invalid refresh token", res);
    }
};

export const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return sendError(400, "Refresh token is required", res);
    }

    try {
        const secret = getJWTSecret();
        const decoded = jwt.verify(refreshToken, secret) as { _id: string };
        const user = await User.findById(decoded._id);
        if (!user) {
            return sendError(401, "Invalid refresh token", res);
        }
        if (!user.refreshTokens.includes(refreshToken)) {
            user.refreshTokens = [];
            await user.save();
            return sendError(401, "Invalid refresh token", res);
        }
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await user.save();
        res.status(200).send();
    } catch (err) {
        if (err instanceof Error && err.message === "JWT_SECRET is not defined") {
            return sendError(500, err.message, res);
        }
        return sendError(401, "Invalid refresh token", res);
    }
};

export const googleSignIn = async (req: Request, res: Response) => {
    const credential = typeof req.body.credential === "string" ? req.body.credential : "";
    if (!credential) {
        return sendError(400, "Google credential is required", res);
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
        return sendError(500, "GOOGLE_CLIENT_ID is not defined", res);
    }

    try {
        const ticket = await oauthClient.verifyIdToken({
            idToken: credential,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();
        const email = payload?.email?.toLowerCase() ?? "";

        if (!email) {
            return sendError(400, "Google account does not expose an email", res);
        }

        let user = await User.findOne({ email });
        if (!user) {
            const defaultName = payload?.name?.trim() || email.split("@")[0];
            const username = normalizeUsername(defaultName) || normalizeUsername(email.split("@")[0]);
            const newUser = new User({
                email,
                password: await bcrypt.hash(randomUUID(), 10),
                name: defaultName,
                username,
                avatarUrl: payload?.picture?.trim() || "",
            });
            user = await newUser.save();
        }

        const tokens = generateToken(user._id.toString());
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        return res.status(200).json(createAuthResponse(user, tokens));
    } catch {
        return sendError(401, "Invalid Google credential", res);
    }
};