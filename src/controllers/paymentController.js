const { Order, Transaction, User } = require("../models");
const { zarinpalRequest, zarinpalVerify } = require('../services/paymentService');

// Zarinpal payment initiation
exports.startPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);
        if (!order || order.userId !== req.user.id) return res.status(404).json({ message: "Order not found" });
        if (order.status !== 'PENDING') return res.status(400).json({ message: "Order is not pending" });

        const amount = order.package.price;
        const description = `پرداخت پکیج ${order.package.title}`;
        const callbackUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/callback`;
        
        const response = await zarinpalRequest({
            merchantId: process.env.ZARINPAL_MERCHANT_ID,
            amount,
            description,
            callbackUrl,
            metadata: { orderId: order.id.toString(), userId: req.user.id.toString() }
        });

        if (response.data && response.data.code === 100) {
            await Transaction.create({
                orderId: order.id,
                amount: amount,
                status: 'PENDING',
                gateway: 'ZARINPAL',
                authority: response.data.authority,
                gatewayData: { requestResponse: response }
            });

            return res.json({
                message: "Payment initiated",
                paymentUrl: `https://www.zarinpal.com/pg/StartPay/${response.data.authority}`,
                authority: response.data.authority
            });
        }

        return res.status(400).json({ message: "Zarinpal error", error: response.errors });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Zarinpal callback handler
exports.paymentCallback = async (req, res) => {
    try {
        const { Authority, Status } = req.query;
        
        if (!Authority || !Status) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?error=Missing callback parameters`);
        }

        // Find transaction by authority
        const transaction = await Transaction.findAll({ authority: Authority });
        if (transaction.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        const transactionData = transaction[0];

        const order = transactionData.order;
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const verifyResponse = await zarinpalVerify({
            merchantId: process.env.ZARINPAL_MERCHANT_ID,
            amount: transactionData.amount,
            authority: Authority
        });

        if (verifyResponse.data && verifyResponse.data.code === 100) {
            await Transaction.update(transactionData.id, {
                status: 'SUCCESS',
                refId: verifyResponse.data.ref_id,
                gatewayData: { ...transactionData.gatewayData, verifyResponse }
            });

            await Order.update(order.id, { status: 'PAID' });

            // Update user subscription
            const user = await User.findById(order.userId);
            if (user) {
                const newExpiryDate = new Date(Date.now() + order.package.duration * 24 * 60 * 60 * 1000);
                await User.update(user.id, {
                    subscriptionActive: true,
                    subscriptionExpiresAt: newExpiryDate
                });
            }

            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?refId=${verifyResponse.data.ref_id}`);
        }

        transaction.status = 'failure';
        await Transaction.update(transaction.id, {
            gatewayData: {
                ...transaction.gatewayData,
                verifyResponse: verifyResponse
            }
        });

        await Order.update(order.id, {
            status: 'CANCELLED'
        });

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?error=${verifyResponse.errors?.message || 'Payment failed'}`);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Legacy mock confirm (for testing)
exports.confirmPayment = async (req, res) => {
    try {
        const { orderId, success } = req.body; // success: true/false
        const order = await Order.findById(orderId);
        if (!order || order.userId !== req.user.id) return res.status(404).json({ message: "Order not found" });

        const status = success ? 'SUCCESS' : 'FAILURE';
        await Transaction.create({ orderId: order.id, amount: order.amount, status, gateway: 'mock' });

        if (success) {
            await Order.update(order.id, {
                status: 'PAID'
            });

            // Add package to user's purchasedPackages
            await User.update(order.userId, {
                purchasedPackages: {
                    connect: { id: order.packageId }
                }
            });
            return res.json({ message: "Payment successful", orderId: order.id });
        } else {
            await Order.update(order.id, {
                status: 'CANCELLED'
            });
            return res.status(400).json({ message: "Payment failed", orderId: order.id });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


