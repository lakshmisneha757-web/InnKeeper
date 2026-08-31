-- CreateTable
CREATE TABLE "Hotel" (
    "id" SERIAL NOT NULL,
    "hotel_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "room_number" TEXT NOT NULL,
    "room_type_id" INTEGER NOT NULL,
    "floor" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_price" DOUBLE PRECISION NOT NULL,
    "availability" BOOLEAN NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hotel_id" INTEGER,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "channel_name" TEXT NOT NULL,
    "api_status" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT true,
    "last_sync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_speed" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChannelInventory" (
    "id" SERIAL NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "last_synced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelInventory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "booking_number" TEXT NOT NULL,
    "room_id" INTEGER NOT NULL,
    "booking_source" TEXT NOT NULL,
    "guest_name" TEXT NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3) NOT NULL,
    "booking_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingRule" (
    "id" SERIAL NOT NULL,
    "rule_name" TEXT NOT NULL,
    "rule_description" TEXT,
    "rule_type" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "comparison" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "action" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingHistory" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "old_price" DOUBLE PRECISION NOT NULL,
    "new_price" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SyncLog" (
    "id" SERIAL NOT NULL,
    "channel" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "response_time" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OccupancyHistory" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "room_type" TEXT NOT NULL,
    "occupancy_percentage" DOUBLE PRECISION NOT NULL,
    "total_rooms" INTEGER NOT NULL,
    "occupied_rooms" INTEGER NOT NULL,

    CONSTRAINT "OccupancyHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Room_room_number_key" ON "Room"("room_number");
CREATE UNIQUE INDEX "RoomType_name_key" ON "RoomType"("name");
CREATE UNIQUE INDEX "Channel_channel_name_key" ON "Channel"("channel_name");
CREATE UNIQUE INDEX "ChannelInventory_channel_id_room_id_key" ON "ChannelInventory"("channel_id", "room_id");

ALTER TABLE "Room" ADD CONSTRAINT "Room_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChannelInventory" ADD CONSTRAINT "ChannelInventory_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChannelInventory" ADD CONSTRAINT "ChannelInventory_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PricingHistory" ADD CONSTRAINT "PricingHistory_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
