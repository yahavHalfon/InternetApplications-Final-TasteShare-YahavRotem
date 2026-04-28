import { Request, Response } from "express";
import { Model } from "mongoose";

class BaseController<T> {
    protected model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(req: Request, res: Response): Promise<Response | void> {
        try {
            const item = await this.model.create(req.body);
            return res.status(201).json(item);
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async put(req: Request, res: Response): Promise<Response | void> {
        try {
            const item = await this.model.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true,
            });
            if (!item) {
                return res.status(404).json({ error: "Item not found" });
            }
            return res.status(200).json(item);
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async delete(req: Request, res: Response): Promise<Response | void> {
        try {
            const item = await this.model.findByIdAndDelete(req.params.id);
            if (!item) {
                return res.status(404).json({ error: "Item not found" });
            }
            return res.status(200).json(item);
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    protected handleError(res: Response, error: unknown) {
        if (error && typeof error === "object" && "name" in error) {
            const err = error as { name: string; message?: string };
            if (err.name === "CastError" || err.name === "ValidationError") {
                return res.status(400).json({ error: err.message || "Bad request" });
            }
        }

        return res.status(500).json({ error: "Internal server error" });
    }
}

export default BaseController;
