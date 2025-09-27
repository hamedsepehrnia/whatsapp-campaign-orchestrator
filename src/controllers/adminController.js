const User = require("../models/User");
const Package = require("../models/Package");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");

exports.listUsers = async (req, res) => {
    try {
        const { q, role, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (q) filter.$or = [
            { name: new RegExp(q, 'i') },
            { email: new RegExp(q, 'i') },
            { phone: new RegExp(q, 'i') },
        ];

        const users = await User.find(filter)
            .skip((+page - 1) * +limit)
            .limit(+limit)
            .sort({ createdAt: -1 });
        const total = await User.countDocuments(filter);
        res.json({ users, page: +page, limit: +limit, total });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const allowed = ["user", "admin", "superAdmin"];
        if (!allowed.includes(role)) return res.status(400).json({ message: "Invalid role" });
        const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Role updated", user });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body; // active, inactive, banned
        const allowed = ["active", "inactive", "banned"];
        if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
        const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Status updated", user });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.listTransactions = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const items = await Transaction.find(filter)
            .populate({ path: 'order', populate: [{ path: 'user' }, { path: 'package' }] })
            .skip((+page - 1) * +limit)
            .limit(+limit)
            .sort({ createdAt: -1 });
        const total = await Transaction.countDocuments(filter);
        res.json({ transactions: items, page: +page, limit: +limit, total });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.dashboardStats = async (req, res) => {
    try {
        const [usersCount, packagesCount, paidOrdersCount, totalSalesAgg] = await Promise.all([
            User.countDocuments({}),
            Package.countDocuments({ status: 'active' }),
            Order.countDocuments({ status: 'paid' }),
            Transaction.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);
        const totalSales = totalSalesAgg[0]?.total || 0;
        res.json({ usersCount, packagesCount, paidOrdersCount, totalSales });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


