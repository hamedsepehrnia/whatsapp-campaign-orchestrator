const prisma = require('../config/prisma');

module.exports = {
  prisma,
  User: {
    // User model methods
    async findById(id) {
      return await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          purchasedPackages: true,
          campaigns: true,
          orders: {
            include: {
              package: true,
              transaction: true
            }
          }
        }
      });
    },

    async findByEmail(email) {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          purchasedPackages: true,
          campaigns: true,
          orders: {
            include: {
              package: true,
              transaction: true
            }
          }
        }
      });
    },

    async findByUsername(username) {
      return await prisma.user.findUnique({
        where: { username },
        include: {
          purchasedPackages: true,
          campaigns: true,
          orders: {
            include: {
              package: true,
              transaction: true
            }
          }
        }
      });
    },

    async findByPhone(phone) {
      return await prisma.user.findUnique({
        where: { phone },
        include: {
          purchasedPackages: true,
          campaigns: true,
          orders: {
            include: {
              package: true,
              transaction: true
            }
          }
        }
      });
    },

    async create(userData) {
      return await prisma.user.create({
        data: userData,
        include: {
          purchasedPackages: true,
          campaigns: true,
          orders: {
            include: {
              package: true,
              transaction: true
            }
          }
        }
      });
    },

    async update(id, userData) {
      return await prisma.user.update({
        where: { id: parseInt(id) },
        data: userData,
        include: {
          purchasedPackages: true,
          campaigns: true,
          orders: {
            include: {
              package: true,
              transaction: true
            }
          }
        }
      });
    },

    async delete(id) {
      return await prisma.user.delete({
        where: { id: parseInt(id) }
      });
    },

    async findAll(filters = {}) {
      return await prisma.user.findMany({
        where: filters,
        include: {
          purchasedPackages: true,
          campaigns: true,
          orders: {
            include: {
              package: true,
              transaction: true
            }
          }
        }
      });
    }
  },

  Campaign: {
    async findById(id) {
      return await prisma.campaign.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: true,
          recipients: true,
          attachments: true
        }
      });
    },

    async findByUser(userId) {
      return await prisma.campaign.findMany({
        where: { userId: parseInt(userId) },
        include: {
          user: true,
          recipients: true,
          attachments: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    async create(campaignData) {
      return await prisma.campaign.create({
        data: campaignData,
        include: {
          user: true,
          recipients: true,
          attachments: true
        }
      });
    },

    async update(id, campaignData) {
      return await prisma.campaign.update({
        where: { id: parseInt(id) },
        data: campaignData,
        include: {
          user: true,
          recipients: true,
          attachments: true
        }
      });
    },

    async delete(id) {
      return await prisma.campaign.delete({
        where: { id: parseInt(id) }
      });
    },

    async findAll(filters = {}) {
      return await prisma.campaign.findMany({
        where: filters,
        include: {
          user: true,
          recipients: true,
          attachments: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Package: {
    async findById(id) {
      return await prisma.package.findUnique({
        where: { id: parseInt(id) },
        include: {
          users: true,
          orders: {
            include: {
              user: true,
              transaction: true
            }
          }
        }
      });
    },

    async findAll(filters = {}) {
      return await prisma.package.findMany({
        where: filters,
        include: {
          users: true,
          orders: {
            include: {
              user: true,
              transaction: true
            }
          }
        }
      });
    },

    async create(packageData) {
      return await prisma.package.create({
        data: packageData,
        include: {
          users: true,
          orders: {
            include: {
              user: true,
              transaction: true
            }
          }
        }
      });
    },

    async update(id, packageData) {
      return await prisma.package.update({
        where: { id: parseInt(id) },
        data: packageData,
        include: {
          users: true,
          orders: {
            include: {
              user: true,
              transaction: true
            }
          }
        }
      });
    },

    async delete(id) {
      return await prisma.package.delete({
        where: { id: parseInt(id) }
      });
    }
  },

  Order: {
    async findById(id) {
      return await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: true,
          package: true,
          transaction: true
        }
      });
    },

    async findByUser(userId) {
      return await prisma.order.findMany({
        where: { userId: parseInt(userId) },
        include: {
          user: true,
          package: true,
          transaction: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    async create(orderData) {
      return await prisma.order.create({
        data: orderData,
        include: {
          user: true,
          package: true,
          transaction: true
        }
      });
    },

    async update(id, orderData) {
      return await prisma.order.update({
        where: { id: parseInt(id) },
        data: orderData,
        include: {
          user: true,
          package: true,
          transaction: true
        }
      });
    },

    async delete(id) {
      return await prisma.order.delete({
        where: { id: parseInt(id) }
      });
    },

    async findAll(filters = {}) {
      return await prisma.order.findMany({
        where: filters,
        include: {
          user: true,
          package: true,
          transaction: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Transaction: {
    async findById(id) {
      return await prisma.transaction.findUnique({
        where: { id: parseInt(id) },
        include: {
          order: {
            include: {
              user: true,
              package: true
            }
          }
        }
      });
    },

    async findByOrder(orderId) {
      return await prisma.transaction.findUnique({
        where: { orderId: parseInt(orderId) },
        include: {
          order: {
            include: {
              user: true,
              package: true
            }
          }
        }
      });
    },

    async create(transactionData) {
      return await prisma.transaction.create({
        data: transactionData,
        include: {
          order: {
            include: {
              user: true,
              package: true
            }
          }
        }
      });
    },

    async update(id, transactionData) {
      return await prisma.transaction.update({
        where: { id: parseInt(id) },
        data: transactionData,
        include: {
          order: {
            include: {
              user: true,
              package: true
            }
          }
        }
      });
    },

    async delete(id) {
      return await prisma.transaction.delete({
        where: { id: parseInt(id) }
      });
    },

    async findAll(filters = {}) {
      return await prisma.transaction.findMany({
        where: filters,
        include: {
          order: {
            include: {
              user: true,
              package: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Otp: {
    async findByTarget(target, channel, purpose) {
      return await prisma.otp.findUnique({
        where: {
          target_channel_purpose: {
            target,
            channel,
            purpose
          }
        }
      });
    },

    async create(otpData) {
      return await prisma.otp.create({
        data: otpData
      });
    },

    async update(id, otpData) {
      return await prisma.otp.update({
        where: { id: parseInt(id) },
        data: otpData
      });
    },

    async delete(id) {
      return await prisma.otp.delete({
        where: { id: parseInt(id) }
      });
    },

    async deleteExpired() {
      return await prisma.otp.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    }
  },

  RefreshToken: {
    async findByToken(token) {
      return await prisma.refreshToken.findUnique({
        where: { token },
        include: {
          user: true
        }
      });
    },

    async findByUser(userId) {
      return await prisma.refreshToken.findMany({
        where: { userId: parseInt(userId) },
        include: {
          user: true
        }
      });
    },

    async create(refreshTokenData) {
      return await prisma.refreshToken.create({
        data: refreshTokenData,
        include: {
          user: true
        }
      });
    },

    async update(id, refreshTokenData) {
      return await prisma.refreshToken.update({
        where: { id: parseInt(id) },
        data: refreshTokenData,
        include: {
          user: true
        }
      });
    },

    async delete(id) {
      return await prisma.refreshToken.delete({
        where: { id: parseInt(id) }
      });
    },

    async deleteByToken(token) {
      return await prisma.refreshToken.delete({
        where: { token }
      });
    },

    async deleteExpired() {
      return await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    },

    async revokeAllForUser(userId) {
      return await prisma.refreshToken.updateMany({
        where: { userId: parseInt(userId) },
        data: { isRevoked: true }
      });
    }
  }
};
