// src/controllers/departmentController.js
import * as departmentService from '../services/departmentService.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const getAllDepartments = async (req, res, next) => {
  try {
    const data = await departmentService.getAllDepartments(false);
    return sendSuccess(res, data, 'Departments retrieved.');
  } catch (err) { next(err); }
};

export const getActiveDepartments = async (req, res, next) => {
  try {
    const data = await departmentService.getAllDepartments(true);
    return sendSuccess(res, data, 'Departments retrieved.');
  } catch (err) { next(err); }
};

export const createDepartment = async (req, res, next) => {
  try {
    const data = await departmentService.createDepartment(req.body);
    return sendCreated(res, data, 'Department created.');
  } catch (err) { next(err); }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const data = await departmentService.updateDepartment(req.params.id, req.body);
    return sendSuccess(res, data, 'Department updated.');
  } catch (err) { next(err); }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const data = await departmentService.deleteDepartment(req.params.id);
    return sendSuccess(res, data, 'Department deleted.');
  } catch (err) { next(err); }
};