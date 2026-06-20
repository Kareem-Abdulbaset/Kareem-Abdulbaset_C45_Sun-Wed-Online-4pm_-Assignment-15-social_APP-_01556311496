import { Request, Response } from "express";
import { CreateUserDto } from "../../dtos/user.dto";

export const createModuleUser = (req: Request<object, object, CreateUserDto>, res: Response) => {
  res.status(201).json({
    success: true,
    user: req.body
  });
};
