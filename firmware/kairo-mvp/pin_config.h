#pragma once

// Waveshare ESP32-S3 Touch AMOLED 2.06" pin configuration

// AMOLED CO5300 (QSPI)
#define LCD_SDIO0   4
#define LCD_SDIO1   5
#define LCD_SDIO2   6
#define LCD_SDIO3   7
#define LCD_SCLK    11
#define LCD_CS      12
#define LCD_RESET   8
#define LCD_WIDTH   410
#define LCD_HEIGHT  502

// Shared I2C bus (touch, IMU, RTC, PMIC)
#define IIC_SDA     15
#define IIC_SCL     14

// Touch (FT3168)
#define TP_INT      38
#define TP_RESET    9

// Buttons
#define BTN_PWR     10  // GPIO10 = PMIC power — DO NOT USE, long press kills device
#define BTN_NAV     0   // GPIO0 = BOOT button (top), safe for navigation

// Display rendering constants
#define CELL_SIZE   24
#define GRID_COLS   16
#define GRID_ROWS   16
#define GRID_PX     (CELL_SIZE * GRID_COLS)   // 384
#define FACE_CX     (LCD_WIDTH / 2)           // 205
#define FACE_CY     (LCD_HEIGHT / 2)          // 251
#define FACE_RADIUS 192
#define GRID_OX     (FACE_CX - GRID_PX / 2)  // 13
#define GRID_OY     (FACE_CY - GRID_PX / 2)  // 59
