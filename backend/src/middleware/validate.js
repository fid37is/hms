// src/middleware/validate.js

import { sendValidationError } from '../utils/response.js';

// Usage: validate(schema)          → validates req.body
//        validate(schema, 'query') → validates req.query
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly:   false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return sendValidationError(res, errors);
    }

    // Write coerced values back (e.g. guests string → number)
    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};