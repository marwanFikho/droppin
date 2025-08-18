-- CreateTable
CREATE TABLE "DroppinShopConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DroppinShopConfig_shop_key" ON "DroppinShopConfig"("shop");
