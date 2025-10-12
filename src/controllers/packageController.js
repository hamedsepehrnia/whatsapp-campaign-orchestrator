const { Package } = require("../models");

exports.createPackage = async (req, res) => {
    try {
        const { title, description, price, duration, category, status } = req.body;
        const pkg = await Package.create({ title, description, price, duration, category, status });
        res.status(201).json({ message: "Package created", package: pkg });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getPackages = async (req, res) => {
    try {
        const { category, status } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status.toUpperCase();
        const items = await Package.findAll(filter);
        res.json({ packages: items });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getPackageById = async (req, res) => {
    try {
        const item = await Package.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Package not found" });
        res.json({ package: item });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updatePackage = async (req, res) => {
    try {
        const updates = req.body;
        const item = await Package.update(req.params.id, updates);
        if (!item) return res.status(404).json({ message: "Package not found" });
        res.json({ message: "Package updated", package: item });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.deletePackage = async (req, res) => {
    try {
        const item = await Package.delete(req.params.id);
        if (!item) return res.status(404).json({ message: "Package not found" });
        res.json({ message: "Package deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


