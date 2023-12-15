-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL,
    `text` VARCHAR(255) NULL,
    `user_id` INTEGER NULL,
    `room_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL,

    INDEX `room_id`(`room_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` INTEGER NOT NULL,
    `key` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_room` (
    `user_id` INTEGER NOT NULL,
    `room_id` INTEGER NOT NULL,

    INDEX `room_id`(`room_id`),
    PRIMARY KEY (`user_id`, `room_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL,
    `google_id` VARCHAR(255) NULL,
    `linkedin_id` VARCHAR(255) NULL,
    `username` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `google_id`(`google_id`),
    UNIQUE INDEX `linkedin_id`(`linkedin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_room` ADD CONSTRAINT `user_room_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_room` ADD CONSTRAINT `user_room_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
