import { Request, Response, NextFunction } from 'express';
import { RolesService, CreateRolDTO, UpdateRolDTO } from '../services/roles.service';

export class RolesController {
  static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await RolesService.getRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  }

  static async getRol(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const rol = await RolesService.getRol(id);
      res.json(rol);
    } catch (error) {
      next(error);
    }
  }

  static async createRol(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateRolDTO = req.body;
      const rol = await RolesService.createRol(data);
      res.status(201).json(rol);
    } catch (error) {
      next(error);
    }
  }

  static async updateRol(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data: UpdateRolDTO = req.body;
      const rol = await RolesService.updateRol(id, data);
      res.json(rol);
    } catch (error) {
      next(error);
    }
  }

  static async deleteRol(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await RolesService.deleteRol(id);
      res.json({ success: true, message: 'Rol eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  }
}

