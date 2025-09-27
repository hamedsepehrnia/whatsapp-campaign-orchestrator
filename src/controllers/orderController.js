const Order = require("../models/Order");
const Package = require("../models/Package");

// Create order in pending status
exports.createOrder = async (req, res) => {
    try {
        const { packageId } = req.body;
        if (!packageId) return res.status(400).json({ message: "packageId is required" });

        const pkg = await Package.findById(packageId);
        if (!pkg || pkg.status !== 'active') return res.status(404).json({ message: "Package not available" });

        const existingPending = await Order.findOne({ user: req.user._id, package: pkg._id, status: 'pending' });
        if (existingPending) return res.status(409).json({ message: "There is already a pending order for this package" });

        const order = await Order.create({ user: req.user._id, package: pkg._id });
        res.status(201).json({ message: "Order created", order });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get current user's orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).populate('package');
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


