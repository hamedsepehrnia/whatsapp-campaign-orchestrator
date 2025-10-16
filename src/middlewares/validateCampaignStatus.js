// Middleware برای validation کردن Campaign Status
const validStatuses = ['DRAFT', 'READY', 'RUNNING', 'COMPLETED', 'PAUSED', 'FAILED'];

exports.validateCampaignStatus = (req, res, next) => {
    const status = req.query.status;
    
    if (status) {
        let cleanStatuses;
        
        if (Array.isArray(status)) {
            // پردازش همه عناصر array
            cleanStatuses = status.map(s => s.trim().toUpperCase());
        } else if (typeof status === 'string') {
            // پردازش string ساده
            cleanStatuses = [status.trim().toUpperCase()];
        } else {
            // تبدیل به string و پردازش
            cleanStatuses = [String(status).trim().toUpperCase()];
        }
        
        // بررسی اینکه همه status ها معتبر باشن
        const invalidStatuses = cleanStatuses.filter(s => !validStatuses.includes(s));
        
        if (invalidStatuses.length > 0) {
            return res.status(400).json({
                message: "Invalid campaign status",
                validStatuses: validStatuses,
                providedStatus: status,
                cleanStatuses: cleanStatuses,
                invalidStatuses: invalidStatuses
            });
        }
        
        // جایگزین کردن status با مقادیر پاک شده
        req.query.status = cleanStatuses.length === 1 ? cleanStatuses[0] : cleanStatuses;
    }
    
    next();
};
