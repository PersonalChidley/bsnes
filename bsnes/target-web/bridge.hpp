#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

enum BsnesWebResult {
  BSNES_WEB_OK = 0,
  BSNES_WEB_INVALID_ARGUMENT = 1,
  BSNES_WEB_NOT_INITIALIZED = 2,
  BSNES_WEB_IO_ERROR = 3,
  BSNES_WEB_CORE_ERROR = 4
};

/*
  Button values intentionally match the Libretro joypad IDs used by the
  existing target-libretro frontend.
*/
enum BsnesWebButton {
  BSNES_WEB_BUTTON_B = 0,
  BSNES_WEB_BUTTON_Y = 1,
  BSNES_WEB_BUTTON_SELECT = 2,
  BSNES_WEB_BUTTON_START = 3,
  BSNES_WEB_BUTTON_UP = 4,
  BSNES_WEB_BUTTON_DOWN = 5,
  BSNES_WEB_BUTTON_LEFT = 6,
  BSNES_WEB_BUTTON_RIGHT = 7,
  BSNES_WEB_BUTTON_A = 8,
  BSNES_WEB_BUTTON_X = 9,
  BSNES_WEB_BUTTON_L = 10,
  BSNES_WEB_BUTTON_R = 11
};

enum BsnesWebVideoFilter {
  BSNES_WEB_VIDEO_FILTER_NONE = 0,
  BSNES_WEB_VIDEO_FILTER_SCANLINES_LIGHT = 1,
  BSNES_WEB_VIDEO_FILTER_SCANLINES_DARK = 2,
  BSNES_WEB_VIDEO_FILTER_SCANLINES_BLACK = 3,
  BSNES_WEB_VIDEO_FILTER_PIXELLATE_2X = 4,
  BSNES_WEB_VIDEO_FILTER_SCALE_2X = 5,
  BSNES_WEB_VIDEO_FILTER_2XSAI = 6,
  BSNES_WEB_VIDEO_FILTER_SUPER_2XSAI = 7,
  BSNES_WEB_VIDEO_FILTER_SUPER_EAGLE = 8,
  BSNES_WEB_VIDEO_FILTER_LQ2X = 9,
  BSNES_WEB_VIDEO_FILTER_HQ2X = 10,
  BSNES_WEB_VIDEO_FILTER_NTSC_RF = 11,
  BSNES_WEB_VIDEO_FILTER_NTSC_COMPOSITE = 12,
  BSNES_WEB_VIDEO_FILTER_NTSC_SVIDEO = 13,
  BSNES_WEB_VIDEO_FILTER_NTSC_RGB = 14
};

int bsnes_web_init(void);
void bsnes_web_shutdown(void);

int bsnes_web_load_rom(const uint8_t* data, size_t size);
void bsnes_web_unload_rom(void);
void bsnes_web_reset(void);
int bsnes_web_run_frame(void);

const uint8_t* bsnes_web_frame_buffer(void);
uint32_t bsnes_web_frame_width(void);
uint32_t bsnes_web_frame_height(void);
uint32_t bsnes_web_frame_pitch(void);

const int16_t* bsnes_web_audio_buffer(void);
size_t bsnes_web_audio_frames(void);
double bsnes_web_frames_per_second(void);
double bsnes_web_audio_sample_rate(void);

void bsnes_web_set_button(uint32_t player, uint32_t button, int pressed);
int bsnes_web_set_video_filter(uint32_t filter);
void bsnes_web_set_overscan(int enabled);
void bsnes_web_set_hires_blur(int enabled);

size_t bsnes_web_state_size(void);
int bsnes_web_save_state(uint8_t* output, size_t capacity);
int bsnes_web_load_state(const uint8_t* data, size_t size);

const char* bsnes_web_last_error(void);

#ifdef __cplusplus
}
#endif
