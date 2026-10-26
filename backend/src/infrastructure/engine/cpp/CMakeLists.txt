# Standalone build of the pure C++ engine (no Node / N-API) for unit tests.
# The Node addon itself is built with node-gyp from binding.gyp.
#
#   cmake -S . -B build-tests && cmake --build build-tests && ctest --test-dir build-tests --output-on-failure
cmake_minimum_required(VERSION 3.16)
project(pacman_engine_tests CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(pacman_core STATIC Maze.cpp GameEngine.cpp)
target_include_directories(pacman_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_compile_options(pacman_core PRIVATE -Wall -Wextra -Wpedantic)

enable_testing()
add_executable(engine_tests tests/engine_tests.cpp)
target_link_libraries(engine_tests PRIVATE pacman_core)
target_compile_options(engine_tests PRIVATE -Wall -Wextra -Wpedantic)
add_test(NAME engine_tests COMMAND engine_tests)
