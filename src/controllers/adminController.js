const { User, Package, Order, Transaction } = require("../models");
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

exports.listUsers = async (req, res) => {
    try {
        const { q, role, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role.toUpperCase();
        if (status) filter.status = status.toUpperCase();
        
        // For search functionality, we'll need to implement it in the model
        const users = await User.findAll(filter);
        
        // Simple pagination (in production, implement proper pagination in Prisma)
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = users.slice(startIndex, endIndex);
        
        res.json({ 
            users: paginatedUsers, 
            page: +page, 
            limit: +limit, 
            total: users.length 
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const allowed = ["USER", "ADMIN", "SUPER_ADMIN"];
        if (!allowed.includes(role.toUpperCase())) return res.status(400).json({ message: "Invalid role" });
        const user = await User.update(userId, { role: role.toUpperCase() });
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
        const allowed = ["ACTIVE", "INACTIVE", "BANNED"];
        if (!allowed.includes(status.toUpperCase())) return res.status(400).json({ message: "Invalid status" });
        const user = await User.update(userId, { status: status.toUpperCase() });
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
        if (status) filter.status = status.toUpperCase();
        const items = await Transaction.findAll(filter);
        
        // Simple pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedTransactions = items.slice(startIndex, endIndex);
        
        res.json({ 
            transactions: paginatedTransactions, 
            page: +page, 
            limit: +limit, 
            total: items.length 
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.dashboardStats = async (req, res) => {
    try {
        const { prisma } = require('../models');
        
        const [usersCount, packagesCount, paidOrdersCount, totalSales] = await Promise.all([
            prisma.user.count(),
            prisma.package.count({ where: { status: 'ACTIVE' } }),
            prisma.order.count({ where: { status: 'PAID' } }),
            prisma.transaction.aggregate({
                where: { status: 'SUCCESS' },
                _sum: { amount: true }
            })
        ]);
        
        res.json({ 
            usersCount, 
            packagesCount, 
            paidOrdersCount, 
            totalSales: totalSales._sum.amount || 0 
        });
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


