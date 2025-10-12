const { Order, Package } = require("../models");

// Create order in pending status
exports.createOrder = async (req, res) => {
    try {
        const { packageId } = req.body;
        if (!packageId) return res.status(400).json({ message: "packageId is required" });

        const pkg = await Package.findById(packageId);
        if (!pkg || pkg.status !== 'ACTIVE') return res.status(404).json({ message: "Package not available" });

        const existingPending = await Order.findAll({ 
            userId: req.user.id, 
            packageId: pkg.id, 
            status: 'PENDING' 
        });
        if (existingPending.length > 0) return res.status(409).json({ message: "There is already a pending order for this package" });

        const order = await Order.create({ userId: req.user.id, packageId: pkg.id });
        res.status(201).json({ message: "Order created", order });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get current user's orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findByUser(req.user.id);
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


