const prisma = require('../config/prisma');

module.exports = {
  prisma,
  User: {
    // User model methods
    async findById(id) {
      try {
        console.log('🔍 User.findById called with ID:', id);
        const user = await prisma.user.findUnique({
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
        console.log('👤 User.findById result:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not found');
        return user;
      } catch (error) {
        console.error('💥 User.findById error:', error);
        throw error;
      }
    },

    async findByEmail(email) {
      try {
        console.log('🔍 User.findByEmail called with email:', email);
        const user = await prisma.user.findUnique({
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
        console.log('👤 User.findByEmail result:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not found');
        return user;
      } catch (error) {
        console.error('💥 User.findByEmail error:', error);
        throw error;
      }
    },

    async findByUsername(username) {
      try {
        console.log('🔍 User.findByUsername called with username:', username);
        const user = await prisma.user.findUnique({
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
        console.log('👤 User.findByUsername result:', user ? `ID: ${user.id}, Username: ${user.username}` : 'Not found');
        return user;
      } catch (error) {
        console.error('💥 User.findByUsername error:', error);
        throw error;
      }
    },

    async findByPhone(phone) {
      try {
        console.log('🔍 User.findByPhone called with phone:', phone);
        const user = await prisma.user.findUnique({
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
        console.log('👤 User.findByPhone result:', user ? `ID: ${user.id}, Phone: ${user.phone}` : 'Not found');
        return user;
      } catch (error) {
        console.error('💥 User.findByPhone error:', error);
        throw error;
      }
    },

    async create(userData) {
      try {
        console.log('🔍 User.create called with data:', { 
          name: userData.name, 
          email: userData.email, 
          username: userData.username,
          phone: userData.phone 
        });
        
        const user = await prisma.user.create({
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
        
        console.log('👤 User.create result:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not created');
        return user;
      } catch (error) {
        console.error('💥 User.create error:', error);
        throw error;
      }
    },

    async update(id, userData) {
      try {
        console.log('🔍 User.update called with ID:', id, 'and data:', userData);
        
        const user = await prisma.user.update({
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
        
        console.log('👤 User.update result:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not updated');
        return user;
      } catch (error) {
        console.error('💥 User.update error:', error);
        throw error;
      }
    },

    async delete(id) {
      try {
        console.log('🔍 User.delete called with ID:', id);
        
        const user = await prisma.user.delete({
          where: { id: parseInt(id) }
        });
        
        console.log('👤 User.delete result:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not deleted');
        return user;
      } catch (error) {
        console.error('💥 User.delete error:', error);
        throw error;
      }
    },

    async findAll(filters = {}) {
      try {
        console.log('🔍 User.findAll called with filters:', filters);
        
        const users = await prisma.user.findMany({
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
        
        console.log('👤 User.findAll result:', users.length, 'users found');
        return users;
      } catch (error) {
        console.error('💥 User.findAll error:', error);
        throw error;
      }
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
      // پاک کردن whitespace از status
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          filters.status = { in: filters.status.map(s => s.trim()) };
        } else {
          filters.status = filters.status.trim();
        }
      }
      
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

    async findByCampaign(campaignId) {
      return await prisma.recipient.findMany({
        where: { campaignId: parseInt(campaignId) },
        include: {
          campaign: true
        },
        orderBy: { id: 'asc' }
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
