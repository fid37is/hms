// src/controllers/fnbController.js
import * as fnbService from '../services/fnbService.js';
import * as v          from '../validators/fnbValidator.js';
import { validate }    from '../middleware/validate.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export const getOutlets      = async (req, res, next) => { try { return sendSuccess(res, await fnbService.getAllOutlets(req.orgId)); } catch(e) { next(e); } };
export const createOutlet    = async (req, res, next) => { try { validate(v.createOutletSchema, req.body); return sendSuccess(res, await fnbService.createOutlet(req.orgId, req.body), 'Outlet created.', 201); } catch(e) { next(e); } };
export const updateOutlet    = async (req, res, next) => { try { return sendSuccess(res, await fnbService.updateOutlet(req.orgId, req.params.id, req.body)); } catch(e) { next(e); } };

export const getMenu         = async (req, res, next) => { try { return sendSuccess(res, await fnbService.getMenu(req.orgId, req.query.outlet_id)); } catch(e) { next(e); } };
export const createMenuItem  = async (req, res, next) => { try { validate(v.createMenuItemSchema, req.body); return sendSuccess(res, await fnbService.createMenuItem(req.orgId, req.body), 'Menu item created.', 201); } catch(e) { next(e); } };
export const updateMenuItem  = async (req, res, next) => { try { validate(v.updateMenuItemSchema, req.body); return sendSuccess(res, await fnbService.updateMenuItem(req.orgId, req.params.id, req.body)); } catch(e) { next(e); } };
export const deleteMenuItem  = async (req, res, next) => { try { return sendSuccess(res, await fnbService.deleteMenuItem(req.orgId, req.params.id)); } catch(e) { next(e); } };

export const getCategories   = async (req, res, next) => { try { return sendSuccess(res, await fnbService.getCategories(req.orgId, req.query.outlet_id)); } catch(e) { next(e); } };
export const createCategory  = async (req, res, next) => { try { validate(v.createCategorySchema, req.body); return sendSuccess(res, await fnbService.createCategory(req.orgId, req.body), 'Category created.', 201); } catch(e) { next(e); } };

export const getTables       = async (req, res, next) => { try { return sendSuccess(res, await fnbService.getTables(req.orgId, req.query.outlet_id)); } catch(e) { next(e); } };
export const createTable     = async (req, res, next) => { try { validate(v.createTableSchema, req.body); return sendSuccess(res, await fnbService.createTable(req.orgId, req.body), 'Table created.', 201); } catch(e) { next(e); } };
export const updateTableStatus = async (req, res, next) => { try { return sendSuccess(res, await fnbService.updateTableStatus(req.orgId, req.params.id, req.body.status)); } catch(e) { next(e); } };

export const getOrders       = async (req, res, next) => { try { const { status, outlet_id, page = 1, limit = 30 } = req.query; const r = await fnbService.getAllOrders(req.orgId, { status, outlet_id }, Number(page), Number(limit)); return sendPaginated(res, r.data, r.total, page, limit); } catch(e) { next(e); } };
export const getOrderById    = async (req, res, next) => { try { return sendSuccess(res, await fnbService.getOrderById(req.orgId, req.params.id)); } catch(e) { next(e); } };
export const createOrder     = async (req, res, next) => { try { validate(v.createOrderSchema, req.body); return sendSuccess(res, await fnbService.createOrder(req.orgId, req.body, req.user.id), 'Order created.', 201); } catch(e) { next(e); } };
export const addItems        = async (req, res, next) => { try { validate(v.addOrderItemsSchema, req.body); return sendSuccess(res, await fnbService.addOrderItems(req.orgId, req.params.id, req.body.items)); } catch(e) { next(e); } };
export const updateStatus    = async (req, res, next) => { try { validate(v.updateOrderStatusSchema, req.body); return sendSuccess(res, await fnbService.updateOrderStatus(req.orgId, req.params.id, req.body.status)); } catch(e) { next(e); } };
export const billOrder       = async (req, res, next) => { try { return sendSuccess(res, await fnbService.billOrder(req.orgId, req.params.id, req.user.id)); } catch(e) { next(e); } };
export const cancelOrder     = async (req, res, next) => { try { return sendSuccess(res, await fnbService.cancelOrder(req.orgId, req.params.id)); } catch(e) { next(e); } };