const { Order, Transaction, User } = require("../models");
const { zarinpalRequest, zarinpalVerify } = require('../services/paymentService');

// Zarinpal payment initiation
exports.startPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId).populate('package');
        if (!order || order.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: "Order not found" });
        if (order.status !== 'pending') return res.status(400).json({ message: "Order is not pending" });

        const amount = order.package.price;
        const description = `پرداخت پکیج ${order.package.title}`;
        const callbackUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/callback`;
        
        const response = await zarinpalRequest({
            merchantId: process.env.ZARINPAL_MERCHANT_ID,
            amount,
            description,
            callbackUrl,
            metadata: { orderId: order._id.toString(), userId: req.user._id.toString() }
        });

        if (response.data && response.data.code === 100) {
            await Transaction.create({
                order: order._id,
                amount: amount,
                status: 'pending',
                gateway: 'zarinpal',
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
        const transaction = await Transaction.findOne({ authority: Authority }).populate({
            path: 'order',
            populate: [{ path: 'user' }, { path: 'package' }]
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const order = transaction.order;
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const verifyResponse = await zarinpalVerify({
            merchantId: process.env.ZARINPAL_MERCHANT_ID,
            amount: transaction.amount,
            authority: Authority
        });

        if (verifyResponse.data && verifyResponse.data.code === 100) {
            transaction.status = 'success';
            transaction.refId = verifyResponse.data.ref_id;
            transaction.gatewayData.verifyResponse = verifyResponse;
            await transaction.save();

            order.status = 'paid';
            await order.save();

            await User.findByIdAndUpdate(
                order.user,
                { 
                    $addToSet: { purchasedPackages: order.package._id },
                    $set: {
                        'subscription.isActive': true,
                        'subscription.expiresAt': new Date(Date.now() + order.package.duration * 24 * 60 * 60 * 1000)
                    }
                }
            );

            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?refId=${verifyResponse.data.ref_id}`);
        }

        transaction.status = 'failure';
        transaction.gatewayData.verifyResponse = verifyResponse;
        await transaction.save();

        order.status = 'cancelled';
        await order.save();

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?error=${verifyResponse.errors?.message || 'Payment failed'}`);

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Legacy mock confirm (for testing)
exports.confirmPayment = async (req, res) => {
    try {
        const { orderId, success } = req.body; // success: true/false
        const order = await Order.findById(orderId).populate('package');
        if (!order || order.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: "Order not found" });

        const status = success ? 'success' : 'failure';
        await Transaction.create({ order: order._id, amount: order.package.price, status, gateway: 'mock' });

        if (success) {
            order.status = 'paid';
            await order.save();

            // Add package to user's purchasedPackages
            await User.findByIdAndUpdate(order.user, { $addToSet: { purchasedPackages: order.package._id } });
            return res.json({ message: "Payment successful", orderId: order._id });
        } else {
            order.status = 'cancelled';
            await order.save();
            return res.status(400).json({ message: "Payment failed", orderId: order._id });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


