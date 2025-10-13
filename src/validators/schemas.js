const { z } = require('zod');

exports.userRegisterSchema = {
    body: z.object({
        name: z.string().min(2),
        username: z.string().min(3),
        email: z.string().email(),
        phone: z.string().min(6),
        password: z.string().min(6),
        verificationToken: z.string(),
    })
};

exports.userRegisterSimpleSchema = {
    body: z.object({
        name: z.string().min(2),
        username: z.string().min(3),
        email: z.string().email(),
        phone: z.string().min(6).optional(),
        password: z.string().min(6),
    })
};

exports.userLoginSchema = {
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
    })
};

exports.packageCreateSchema = {
    body: z.object({
        title: z.string().min(2),
        description: z.string().min(2),
        price: z.number().positive(),
        duration: z.number().int().positive(),
        category: z.string().min(2),
        status: z.enum(['active', 'inactive']).optional(),
    })
};

exports.packageUpdateSchema = {
    body: z.object({
        title: z.string().min(2).optional(),
        description: z.string().min(2).optional(),
        price: z.number().positive().optional(),
        duration: z.number().int().positive().optional(),
        category: z.string().min(2).optional(),
        status: z.enum(['active', 'inactive']).optional(),
    })
};

exports.orderCreateSchema = {
    body: z.object({
        packageId: z.string().length(24),
    })
};

exports.paymentStartSchema = {
    body: z.object({
        orderId: z.string().length(24),
    })
};

exports.paymentConfirmSchema = {
    body: z.object({
        orderId: z.string().length(24),
        success: z.boolean(),
    })
};

exports.otpRequestSchema = {
    body: z.object({
        channel: z.enum(['sms', 'email']),
        target: z.string().min(5),
    })
};

exports.otpVerifySchema = {
    body: z.object({
        channel: z.enum(['sms', 'email']),
        target: z.string().min(5),
        code: z.string().length(6),
    })
};

exports.adminUpdateRoleSchema = {
    params: z.object({ userId: z.string().length(24) }),
    body: z.object({ role: z.enum(['user', 'admin', 'superAdmin']) })
};

exports.adminUpdateStatusSchema = {
    params: z.object({ userId: z.string().length(24) }),
    body: z.object({ status: z.enum(['active', 'inactive', 'banned']) })
};


