// src/utils/response.js

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
    const payload = { success: true, message, data };
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  };
  
  export const sendCreated = (res, data = null, message = 'Created successfully') => {
    return sendSuccess(res, data, message, 201);
  };
  
  export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
    const payload = { success: false, message };
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
  };
  
  export const sendNotFound = (res, message = 'Resource not found') => {
    return sendError(res, message, 404);
  };
  
  export const sendUnauthorized = (res, message = 'Unauthorized') => {
    return sendError(res, message, 401);
  };
  
  export const sendForbidden = (res, message = 'You do not have permission to perform this action') => {
    return sendError(res, message, 403);
  };
  
  export const sendValidationError = (res, errors, message = 'Validation failed') => {
    return sendError(res, message, 422, errors);
  };
  
  export const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
    return sendSuccess(res, data, message, 200, {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / limit),
      hasNext:    Number(page) * Number(limit) < total,
      hasPrev:    Number(page) > 1,
    });
  };