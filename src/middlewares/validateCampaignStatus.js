// Middleware برای validation کردن Campaign Status
const validStatuses = ['DRAFT', 'READY', 'RUNNING', 'COMPLETED', 'PAUSED', 'FAILED'];

exports.validateCampaignStatus = (req, res, next) => {
    const { status } = req.query;
    
    if (status) {
        const cleanStatus = status.trim().toUpperCase();
        
        if (!validStatuses.includes(cleanStatus)) {
            return res.status(400).json({
                message: "Invalid campaign status",
                validStatuses: validStatuses,
                providedStatus: status
            });
        }
        
        // جایگزین کردن status با مقدار پاک شده
        req.query.status = cleanStatus;
    }
    
    next();
};
