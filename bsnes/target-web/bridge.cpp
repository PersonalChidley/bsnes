#include "bridge.hpp"

#include <target-libretro/libretro.h>

#include <cstdarg>
#include <cstdio>
#include <cstring>
#include <string>
#include <sys/stat.h>
#include <vector>

#if defined(_WIN32)
  #include <direct.h>
#endif

#if defined(__EMSCRIPTEN__)
  #include <emscripten/emscripten.h>
  #define BSNES_WEB_EXPORT EMSCRIPTEN_KEEPALIVE
#else
  #define BSNES_WEB_EXPORT
#endif

namespace {

bool initialized = false;
bool gameLoaded = false;
bool buttons[2][16] = {};
const uint8_t* frameBuffer = nullptr;
uint32_t frameWidth = 0;
uint32_t frameHeight = 0;
uint32_t framePitch = 0;
std::vector<int16_t> audioBuffer;
double framesPerSecond = 60.0;
double audioSampleRate = 48000.0;
std::string lastError;

auto setError(const char* message) -> int {
  lastError = message;
  return BSNES_WEB_CORE_ERROR;
}

auto logMessage(enum retro_log_level, const char* format, ...) -> void {
  va_list arguments;
  va_start(arguments, format);
  std::vfprintf(stderr, format, arguments);
  va_end(arguments);
}

auto environment(unsigned command, void* data) -> bool {
  static const char* saveDirectory = "/saves";
  static const char* systemDirectory = "/system";

  switch(command) {
  case RETRO_ENVIRONMENT_GET_LOG_INTERFACE:
    static_cast<retro_log_callback*>(data)->log = logMessage;
    return true;
  case RETRO_ENVIRONMENT_SET_PIXEL_FORMAT:
    return *static_cast<retro_pixel_format*>(data) == RETRO_PIXEL_FORMAT_XRGB8888;
  case RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY:
    *static_cast<const char**>(data) = saveDirectory;
    return true;
  case RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY:
    *static_cast<const char**>(data) = systemDirectory;
    return true;
  case RETRO_ENVIRONMENT_GET_VARIABLE:
    return false;  //Use the core's built-in defaults for the first milestone.
  case RETRO_ENVIRONMENT_GET_VARIABLE_UPDATE:
  case RETRO_ENVIRONMENT_GET_FASTFORWARDING:
    *static_cast<bool*>(data) = false;
    return true;
  case RETRO_ENVIRONMENT_SET_VARIABLES:
  case RETRO_ENVIRONMENT_SET_GEOMETRY:
  case RETRO_ENVIRONMENT_SET_INPUT_DESCRIPTORS:
  case RETRO_ENVIRONMENT_SET_CONTROLLER_INFO:
  case RETRO_ENVIRONMENT_SET_SUPPORT_NO_GAME:
  case RETRO_ENVIRONMENT_SET_PERFORMANCE_LEVEL:
    return true;
  default:
    return false;
  }
}

auto videoRefresh(const void* data, unsigned width, unsigned height, size_t pitch) -> void {
  if(!data) return;
  frameBuffer = static_cast<const uint8_t*>(data);
  frameWidth = width;
  frameHeight = height;
  framePitch = static_cast<uint32_t>(pitch);
}

auto audioSample(int16_t left, int16_t right) -> void {
  audioBuffer.push_back(left);
  audioBuffer.push_back(right);
}

auto audioSampleBatch(const int16_t* data, size_t frames) -> size_t {
  audioBuffer.insert(audioBuffer.end(), data, data + frames * 2);
  return frames;
}

auto inputPoll() -> void {
}

auto inputState(unsigned port, unsigned device, unsigned, unsigned id) -> int16_t {
  if(device != RETRO_DEVICE_JOYPAD || port >= 2 || id >= 16) return 0;
  return buttons[port][id] ? 1 : 0;
}

auto ensureDirectory(const char* path) -> bool {
#if defined(_WIN32)
  if(_mkdir(path) == 0) return true;
#else
  if(mkdir(path, 0755) == 0) return true;
#endif
  struct stat info = {};
  return stat(path, &info) == 0 && (info.st_mode & S_IFDIR);
}

}  //namespace

extern "C" {

BSNES_WEB_EXPORT int bsnes_web_init(void) {
  if(initialized) return BSNES_WEB_OK;

  lastError.clear();
  if(!ensureDirectory("/roms") || !ensureDirectory("/saves") || !ensureDirectory("/system")) {
    lastError = "Unable to initialize the browser filesystem.";
    return BSNES_WEB_IO_ERROR;
  }

  retro_set_environment(environment);
  retro_set_video_refresh(videoRefresh);
  retro_set_audio_sample(audioSample);
  retro_set_audio_sample_batch(audioSampleBatch);
  retro_set_input_poll(inputPoll);
  retro_set_input_state(inputState);
  retro_init();

  initialized = true;
  return BSNES_WEB_OK;
}

BSNES_WEB_EXPORT void bsnes_web_shutdown(void) {
  if(!initialized) return;
  if(gameLoaded) retro_unload_game();
  retro_deinit();

  initialized = false;
  gameLoaded = false;
  frameBuffer = nullptr;
  audioBuffer.clear();
}

BSNES_WEB_EXPORT int bsnes_web_load_rom(const uint8_t* data, size_t size) {
  if(!initialized) return BSNES_WEB_NOT_INITIALIZED;
  if(!data || !size) return BSNES_WEB_INVALID_ARGUMENT;

  if(gameLoaded) {
    retro_unload_game();
    gameLoaded = false;
  }

  static const char* romPath = "/roms/game.sfc";
  std::FILE* file = std::fopen(romPath, "wb");
  if(!file) {
    lastError = "Unable to create the in-memory ROM file.";
    return BSNES_WEB_IO_ERROR;
  }

  size_t written = std::fwrite(data, 1, size, file);
  std::fclose(file);
  if(written != size) {
    lastError = "Unable to write the complete ROM to browser memory.";
    return BSNES_WEB_IO_ERROR;
  }

  retro_game_info game = {};
  game.path = romPath;
  if(!retro_load_game(&game)) return setError("The bsnes core rejected the ROM.");

  retro_system_av_info avInfo = {};
  retro_get_system_av_info(&avInfo);
  framesPerSecond = avInfo.timing.fps;
  audioSampleRate = avInfo.timing.sample_rate;

  gameLoaded = true;
  frameBuffer = nullptr;
  audioBuffer.clear();
  std::memset(buttons, 0, sizeof(buttons));
  return BSNES_WEB_OK;
}

BSNES_WEB_EXPORT void bsnes_web_unload_rom(void) {
  if(!initialized || !gameLoaded) return;
  retro_unload_game();
  gameLoaded = false;
  frameBuffer = nullptr;
  audioBuffer.clear();
}

BSNES_WEB_EXPORT void bsnes_web_reset(void) {
  if(initialized && gameLoaded) retro_reset();
}

BSNES_WEB_EXPORT int bsnes_web_run_frame(void) {
  if(!initialized || !gameLoaded) return BSNES_WEB_NOT_INITIALIZED;
  audioBuffer.clear();
  retro_run();
  return frameBuffer ? BSNES_WEB_OK : setError("The core did not produce a video frame.");
}

BSNES_WEB_EXPORT const uint8_t* bsnes_web_frame_buffer(void) {
  return frameBuffer;
}

BSNES_WEB_EXPORT uint32_t bsnes_web_frame_width(void) {
  return frameWidth;
}

BSNES_WEB_EXPORT uint32_t bsnes_web_frame_height(void) {
  return frameHeight;
}

BSNES_WEB_EXPORT uint32_t bsnes_web_frame_pitch(void) {
  return framePitch;
}

BSNES_WEB_EXPORT const int16_t* bsnes_web_audio_buffer(void) {
  return audioBuffer.empty() ? nullptr : audioBuffer.data();
}

BSNES_WEB_EXPORT size_t bsnes_web_audio_frames(void) {
  return audioBuffer.size() / 2;
}

BSNES_WEB_EXPORT double bsnes_web_frames_per_second(void) {
  return framesPerSecond;
}

BSNES_WEB_EXPORT double bsnes_web_audio_sample_rate(void) {
  return audioSampleRate;
}

BSNES_WEB_EXPORT void bsnes_web_set_button(uint32_t player, uint32_t button, int pressed) {
  if(player >= 2 || button >= 16) return;
  buttons[player][button] = pressed != 0;
}

BSNES_WEB_EXPORT size_t bsnes_web_state_size(void) {
  return initialized && gameLoaded ? retro_serialize_size() : 0;
}

BSNES_WEB_EXPORT int bsnes_web_save_state(uint8_t* output, size_t capacity) {
  if(!initialized || !gameLoaded) return BSNES_WEB_NOT_INITIALIZED;
  size_t size = retro_serialize_size();
  if(!output || capacity < size) return BSNES_WEB_INVALID_ARGUMENT;
  return retro_serialize(output, size) ? BSNES_WEB_OK : setError("Unable to serialize the emulator state.");
}

BSNES_WEB_EXPORT int bsnes_web_load_state(const uint8_t* data, size_t size) {
  if(!initialized || !gameLoaded) return BSNES_WEB_NOT_INITIALIZED;
  if(!data || !size) return BSNES_WEB_INVALID_ARGUMENT;
  return retro_unserialize(data, size) ? BSNES_WEB_OK : setError("The save state is invalid or incompatible.");
}

BSNES_WEB_EXPORT const char* bsnes_web_last_error(void) {
  return lastError.c_str();
}

}  //extern "C"
