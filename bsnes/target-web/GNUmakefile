name := bsnes-core
local := false
openmp := false
web.output ?= out

flags += -Wno-narrowing -Wno-multichar
flags += -fno-strict-aliasing -fwrapv -Wno-everything
flags += -sASYNCIFY=1

objects := libretro web $(objects)
objects := $(patsubst %,obj/%.o,$(objects))

obj/libretro.o: target-libretro/libretro.cpp
obj/web.o: target-web/bridge.cpp

web.exports := _malloc,_free
web.exports := $(web.exports),_bsnes_web_init,_bsnes_web_shutdown
web.exports := $(web.exports),_bsnes_web_load_rom,_bsnes_web_unload_rom
web.exports := $(web.exports),_bsnes_web_reset,_bsnes_web_run_frame
web.exports := $(web.exports),_bsnes_web_frame_buffer
web.exports := $(web.exports),_bsnes_web_frame_width,_bsnes_web_frame_height,_bsnes_web_frame_pitch
web.exports := $(web.exports),_bsnes_web_audio_buffer,_bsnes_web_audio_frames
web.exports := $(web.exports),_bsnes_web_frames_per_second,_bsnes_web_audio_sample_rate
web.exports := $(web.exports),_bsnes_web_set_button
web.exports := $(web.exports),_bsnes_web_set_video_filter
web.exports := $(web.exports),_bsnes_web_set_overscan,_bsnes_web_set_hires_blur
web.exports := $(web.exports),_bsnes_web_state_size,_bsnes_web_save_state,_bsnes_web_load_state
web.exports := $(web.exports),_bsnes_web_last_error

all: $(objects)
	@mkdir -p $(web.output)
	$(strip $(compiler) -o $(web.output)/$(name).mjs $(objects) \
	  --no-entry \
	  -sASYNCIFY=1 \
	  -sALLOW_MEMORY_GROWTH=1 \
	  -sINITIAL_MEMORY=268435456 \
	  -sFILESYSTEM=1 \
	  -sFORCE_FILESYSTEM=1 \
	  -sMODULARIZE=1 \
	  -sEXPORT_ES6=1 \
	  -sEXPORT_NAME=createBsnesCore \
	  -sENVIRONMENT=worker \
	  -sINVOKE_RUN=0 \
	  -sNO_EXIT_RUNTIME=1 \
	  -sEXPORTED_FUNCTIONS=$(web.exports) \
	  -sEXPORTED_RUNTIME_METHODS=UTF8ToString,HEAPU8,HEAP16 \
	  $(options))
