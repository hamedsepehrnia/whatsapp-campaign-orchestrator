const { User, Package, Order, Transaction } = require("../models");
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

exports.listUsers = async (req, res) => {
    try {
        const { q, role, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (q) filter.$or = [
            { name: new RegExp(q, 'i') },
            { username: new RegExp(q, 'i') },
            { email: new RegExp(q, 'i') },
            { phone: new RegExp(q, 'i') },
        ];

        const users = await User.find(filter)
            .select('name username email phone role status createdAt')
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

// Excel Template Management
exports.uploadExcelTemplate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Excel template file is required" });
        }

        // Validate file type
        if (!req.file.mimetype.includes('spreadsheetml') && 
            !req.file.mimetype.includes('excel') &&
            !req.file.originalname.endsWith('.xlsx')) {
            return res.status(400).json({ 
                message: "Invalid file type. Only Excel files (.xlsx) are allowed" 
            });
        }

        // Create templates directory if it doesn't exist
        const templatesDir = path.join(__dirname, '../uploads/templates');
        if (!fs.existsSync(templatesDir)) {
            fs.mkdirSync(templatesDir, { recursive: true });
        }

        // Move file to templates directory
        const templatePath = path.join(templatesDir, 'recipients-template.xlsx');
        fs.renameSync(req.file.path, templatePath);

        res.json({
            message: "Excel template uploaded successfully",
            template: {
                filename: 'recipients-template.xlsx',
                originalName: req.file.originalname,
                size: req.file.size,
                path: templatePath
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.downloadExcelTemplate = async (req, res) => {
    try {
        const templatesDir = path.join(__dirname, '../uploads/templates');
        const templatePath = path.join(templatesDir, 'recipients-template.xlsx');

        // Check if template exists
        if (!fs.existsSync(templatePath)) {
            // Create default template if it doesn't exist
            const defaultTemplate = {
                'Sheet1': [
                    ['phone', 'name'],
                    ['09123456789', 'علی احمدی'],
                    ['09987654321', 'فاطمه محمدی'],
                    ['09111111111', 'حسن رضایی']
                ]
            };

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(defaultTemplate.Sheet1);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            
            // Create templates directory if it doesn't exist
            if (!fs.existsSync(templatesDir)) {
                fs.mkdirSync(templatesDir, { recursive: true });
            }
            
            XLSX.writeFile(workbook, templatePath);
        }

        // Send the template file
        res.download(templatePath, 'recipients-template.xlsx', (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ message: "Error downloading template" });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getExcelTemplateInfo = async (req, res) => {
    try {
        const templatesDir = path.join(__dirname, '../uploads/templates');
        const templatePath = path.join(templatesDir, 'recipients-template.xlsx');

        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ 
                message: "Excel template not found",
                hasTemplate: false
            });
        }

        const stats = fs.statSync(templatePath);
        res.json({
            hasTemplate: true,
            template: {
                filename: 'recipients-template.xlsx',
                size: stats.size,
                lastModified: stats.mtime,
                path: templatePath
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


