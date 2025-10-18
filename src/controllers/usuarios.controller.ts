import { Request, Response, NextFunction } from 'express';
import { UsuariosService, CreateUsuarioDTO, UpdateUsuarioDTO } from '../services/usuarios.service';

export class UsuariosController {
  static async getUsuarios(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await UsuariosService.getUsuarios();
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  }

  static async getUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const usuario = await UsuariosService.getUsuario(id);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }

  static async createUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateUsuarioDTO = req.body;
      const usuario = await UsuariosService.createUsuario(data);
      res.status(201).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  static async updateUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data: UpdateUsuarioDTO = req.body;
      const usuario = await UsuariosService.updateUsuario(id, data);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await UsuariosService.deleteUsuario(id);
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  }

  static async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const estadisticas = await UsuariosService.getEstadisticas();
      res.json(estadisticas);
    } catch (error) {
      next(error);
    }
  }
}

