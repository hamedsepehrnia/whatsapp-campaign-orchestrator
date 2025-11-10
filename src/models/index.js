const prisma = require('../config/prisma');

module.exports = {
  prisma,
  User: {
    async findById(id) {
      if (!id || id === 'undefined' || id === 'null') {
        return null;
      }
      
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return null;
      }
      
      return await prisma.user.findUnique({
        where: { id: parsedId },
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

    async findAll(filters = {}, pagination = {}) {
      // Normalize status: convert to uppercase and trim whitespace
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          // اگر array باشه، همه عناصر رو trim کن و به uppercase تبدیل کن
          filters.status = { in: filters.status.map(s => s.trim().toUpperCase()) };
        } else if (typeof filters.status === 'string') {
          // اگر string باشه، trim کن و به uppercase تبدیل کن
          filters.status = filters.status.trim().toUpperCase();
        } else if (filters.status.in && Array.isArray(filters.status.in)) {
          // اگر object باشه با in property، عناصر array رو normalize کن
          filters.status.in = filters.status.in.map(s => 
            typeof s === 'string' ? s.trim().toUpperCase() : s
          );
        }
        // اگر object باشه با property های دیگه (مثل { not: ... }), تغییر نمی‌دیم
      }
      
      const { page = 1, limit = 10, skip, take } = pagination;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      return await prisma.campaign.findMany({
        where: filters,
        include: {
          user: true,
          recipients: true,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        skip: skip !== undefined ? skip : (pageNum - 1) * limitNum,
        take: take !== undefined ? take : limitNum
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
    },

    async findByTargetAndChannel(target, channel, purpose) {
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

    async upsert(where, data) {
      return await prisma.otp.upsert({
        where: {
          target_channel_purpose: where
        },
        update: data,
        create: {
          ...where,
          ...data
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
  },

  Recipient: {
    async findById(id) {
      return await prisma.recipient.findUnique({
        where: { id: parseInt(id) },
        include: {
          campaign: true
        }
      });
    },

    async findByCampaign(campaignId, sortBy = 'id', sortOrder = 'asc') {
      // Sort options
      const sortOptions = {
        'id': { id: sortOrder === 'desc' ? 'desc' : 'asc' },
        'phone': { phone: sortOrder === 'desc' ? 'desc' : 'asc' },
        'name': { name: sortOrder === 'desc' ? 'desc' : 'asc' },
        'status': { status: sortOrder === 'desc' ? 'desc' : 'asc' },
        'sentAt': { sentAt: sortOrder === 'desc' ? 'desc' : 'asc' }
      };

      const orderBy = sortOptions[sortBy] || sortOptions['id'];

      return await prisma.recipient.findMany({
        where: { campaignId: parseInt(campaignId) },
        include: {
          campaign: true
        },
        orderBy
      });
    },

    async findByPhone(phone) {
      return await prisma.recipient.findMany({
        where: { phone },
        include: {
          campaign: true
        }
      });
    },

    async create(recipientData) {
      return await prisma.recipient.create({
        data: recipientData,
        include: {
          campaign: true
        }
      });
    },

    async createMany(recipientsData) {
      return await prisma.recipient.createMany({
        data: recipientsData
      });
    },

    async update(id, recipientData) {
      return await prisma.recipient.update({
        where: { id: parseInt(id) },
        data: recipientData,
        include: {
          campaign: true
        }
      });
    },

    async updateMany(campaignId, recipientData) {
      return await prisma.recipient.updateMany({
        where: { campaignId: parseInt(campaignId) },
        data: recipientData
      });
    },

    async delete(id) {
      return await prisma.recipient.delete({
        where: { id: parseInt(id) }
      });
    },

    async deleteByCampaign(campaignId) {
      return await prisma.recipient.deleteMany({
        where: { campaignId: parseInt(campaignId) }
      });
    },

    async getStats(campaignId) {
      const stats = await prisma.recipient.groupBy({
        by: ['status'],
        where: { campaignId: parseInt(campaignId) },
        _count: {
          status: true
        }
      });

      return stats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.status;
        return acc;
      }, {});
    },

    async findAll(filters = {}) {
      return await prisma.recipient.findMany({
        where: filters,
        include: {
          campaign: true
        },
        orderBy: { id: 'asc' }
      });
    }
  },

  Attachment: {
    async findById(id) {
      return await prisma.attachment.findUnique({
        where: { id: parseInt(id) },
        include: {
          campaign: true
        }
      });
    },

    async findByCampaign(campaignId) {
      return await prisma.attachment.findMany({
        where: { campaignId: parseInt(campaignId) },
        include: {
          campaign: true
        },
        orderBy: { createdAt: 'asc' }
      });
    },

    async create(attachmentData) {
      return await prisma.attachment.create({
        data: attachmentData,
        include: {
          campaign: true
        }
      });
    },

    async update(id, attachmentData) {
      return await prisma.attachment.update({
        where: { id: parseInt(id) },
        data: attachmentData,
        include: {
          campaign: true
        }
      });
    },

    async delete(id) {
      return await prisma.attachment.delete({
        where: { id: parseInt(id) }
      });
    },

    async deleteByCampaign(campaignId) {
      return await prisma.attachment.deleteMany({
        where: { campaignId: parseInt(campaignId) }
      });
    },

    async findAll(filters = {}) {
      return await prisma.attachment.findMany({
        where: filters,
        include: {
          campaign: true
        },
        orderBy: { createdAt: 'asc' }
      });
    }
  }
};
