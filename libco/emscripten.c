/*
  Emscripten backend for libco.

  Emscripten fibers use Asyncify to preserve and restore WebAssembly stacks.
  This backend is deliberately non-serializable: bsnes will use synchronized
  save states rather than attempting to copy opaque fiber state.
*/

#define LIBCO_C
#include "libco.h"
#include "settings.h"

#include <emscripten/fiber.h>
#include <stdint.h>
#include <stdlib.h>

#ifdef __cplusplus
extern "C" {
#endif

enum {
  LIBCO_ASYNCIFY_STACK_SIZE = 64 * 1024
};

typedef struct {
  emscripten_fiber_t fiber;
  void (*entrypoint)(void);
  void* allocation;
  void* c_stack;
  void* asyncify_stack;
} cothread_struct;

static thread_local cothread_struct co_primary;
static thread_local cothread_struct* co_running = 0;
static thread_local unsigned char co_primary_asyncify_stack[LIBCO_ASYNCIFY_STACK_SIZE];

static void co_entry(void* context) {
  cothread_struct* thread = (cothread_struct*)context;
  thread->entrypoint();
  abort();  /* A libco entry point must switch away instead of returning. */
}

static void co_initialize_primary(void) {
  if(co_running) return;
  co_primary.allocation = 0;
  co_primary.c_stack = 0;
  co_primary.asyncify_stack = co_primary_asyncify_stack;
  co_primary.entrypoint = 0;
  emscripten_fiber_init_from_current_context(
    &co_primary.fiber,
    co_primary.asyncify_stack,
    LIBCO_ASYNCIFY_STACK_SIZE
  );
  co_running = &co_primary;
}

cothread_t co_active(void) {
  co_initialize_primary();
  return (cothread_t)co_running;
}

cothread_t co_derive(void* memory, unsigned int size, void (*entrypoint)(void)) {
  co_initialize_primary();
  if(!memory || !entrypoint) return (cothread_t)0;

  /*
    bsnes calls co_derive() with a handle previously returned by co_create()
    when reinitializing a core thread. Preserve those owned stacks.
  */
  cothread_struct* thread = (cothread_struct*)memory;
  if(!thread->allocation || !thread->c_stack || !thread->asyncify_stack) {
    return (cothread_t)0;
  }

  thread->entrypoint = entrypoint;
  emscripten_fiber_init(
    &thread->fiber,
    co_entry,
    thread,
    thread->c_stack,
    size,
    thread->asyncify_stack,
    LIBCO_ASYNCIFY_STACK_SIZE
  );
  return (cothread_t)thread;
}

cothread_t co_create(unsigned int size, void (*entrypoint)(void)) {
  co_initialize_primary();

  size_t total = sizeof(cothread_struct) + 15 + size + LIBCO_ASYNCIFY_STACK_SIZE;
  unsigned char* allocation = (unsigned char*)LIBCO_MALLOC(total);
  if(!allocation) return (cothread_t)0;

  cothread_struct* thread = (cothread_struct*)allocation;
  uintptr_t stack_address = ((uintptr_t)(allocation + sizeof(cothread_struct)) + 15) & ~(uintptr_t)15;

  thread->allocation = allocation;
  thread->c_stack = (void*)stack_address;
  thread->asyncify_stack = (void*)(stack_address + size);

  return co_derive(thread, size, entrypoint);
}

void co_delete(cothread_t cothread) {
  if(!cothread || cothread == (cothread_t)&co_primary) return;
  cothread_struct* thread = (cothread_struct*)cothread;
  LIBCO_FREE(thread->allocation);
}

void co_switch(cothread_t cothread) {
  co_initialize_primary();
  if(!cothread || cothread == (cothread_t)co_running) return;

  cothread_struct* previous = co_running;
  co_running = (cothread_struct*)cothread;
  emscripten_fiber_swap(&previous->fiber, &co_running->fiber);
}

int co_serializable(void) {
  return 0;
}

#ifdef __cplusplus
}
#endif
