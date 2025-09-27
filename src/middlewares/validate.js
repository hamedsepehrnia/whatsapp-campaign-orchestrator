// Reusable Zod-based validator for body, query, and params
exports.validate = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body) req.body = schema.body.parse(req.body);
            if (schema.query) req.query = schema.query.parse(req.query);
            if (schema.params) req.params = schema.params.parse(req.params);
            next();
        } catch (err) {
            if (err?.issues) {
                return res.status(400).json({ message: "Validation error", errors: err.issues });
            }
            next(err);
        }
    }
}


