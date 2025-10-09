const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true, sparse: true, trim: true },
        email: { type: String, required: true, unique: true, sparse: true },
        phone: { type: String, required: true, unique: true, sparse: true },
        password: { type: String, required: true },
        role: { type: String, required: true, enum: ["user", "admin", "superAdmin"], default: "user" },
        status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },
        profile: {
            age: { type: Number},
            address: { type: String },
            avatar: { type: String },
        },
        purchasedPackages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Package',
        }
        ],
        subscription: {
            isActive: {type: Boolean, default: false},
            expiresAt: {type: Date, default: null},
        },

    },
    {timestamps: true},
)

// Indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model("User", userSchema);