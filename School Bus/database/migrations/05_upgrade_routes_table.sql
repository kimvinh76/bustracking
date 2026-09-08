-- Migration 05: Upgrade routes table
-- Add shift_type column to explicitly manage morning and afternoon shifts

-- 1. Add shift_type column
ALTER TABLE `routes` 
ADD COLUMN `shift_type` ENUM('morning', 'afternoon') NOT NULL DEFAULT 'morning' COMMENT 'Ca chạy của tuyến';

-- 2. Update existing routes based on their names
-- If the route name contains 'chiều' or 'afternoon', set it to 'afternoon'
UPDATE `routes`
SET `shift_type` = 'afternoon'
WHERE LOWER(`route_name`) LIKE '%chiều%' OR LOWER(`route_name`) LIKE '%afternoon%';

-- The rest will naturally default to 'morning', but let's be explicit just in case
UPDATE `routes`
SET `shift_type` = 'morning'
WHERE LOWER(`route_name`) LIKE '%sáng%' OR LOWER(`route_name`) LIKE '%morning%';
