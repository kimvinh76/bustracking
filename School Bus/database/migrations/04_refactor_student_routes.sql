-- Migration 04: Refactor Student Routes to Junction Table (RESTful Approach)

-- 1. Create junction table
CREATE TABLE IF NOT EXISTS `student_route_subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `route_id` INT NOT NULL,
  `stop_id` INT NOT NULL,
  `shift_type` ENUM('morning', 'afternoon') NOT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stop_id`) REFERENCES `stops`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_student_shift` (`student_id`, `shift_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Migrate existing data (Morning Shift)
INSERT INTO `student_route_subscriptions` (`student_id`, `route_id`, `stop_id`, `shift_type`)
SELECT `id`, `morning_route_id`, `morning_pickup_stop_id`, 'morning'
FROM `students`
WHERE `morning_route_id` IS NOT NULL AND `morning_pickup_stop_id` IS NOT NULL;

-- 3. Migrate existing data (Afternoon Shift)
INSERT INTO `student_route_subscriptions` (`student_id`, `route_id`, `stop_id`, `shift_type`)
SELECT `id`, `afternoon_route_id`, `afternoon_dropoff_stop_id`, 'afternoon'
FROM `students`
WHERE `afternoon_route_id` IS NOT NULL AND `afternoon_dropoff_stop_id` IS NOT NULL;

-- 4. Drop foreign key constraints on students table
-- Note: Must drop foreign keys before dropping columns
ALTER TABLE `students`
  DROP FOREIGN KEY `fk_morning_route`,
  DROP FOREIGN KEY `fk_morning_pickup_stop`,
  DROP FOREIGN KEY `fk_afternoon_route`,
  DROP FOREIGN KEY `fk_afternoon_dropoff_stop`;

-- 5. Drop old columns from students table
ALTER TABLE `students`
  DROP COLUMN `morning_route_id`,
  DROP COLUMN `morning_pickup_stop_id`,
  DROP COLUMN `afternoon_route_id`,
  DROP COLUMN `afternoon_dropoff_stop_id`;
